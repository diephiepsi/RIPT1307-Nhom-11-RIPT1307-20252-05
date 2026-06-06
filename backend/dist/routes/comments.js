"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const db_1 = require("../db");
const auth_1 = require("../middlewares/auth");
const voting_1 = require("../utils/voting");
const router = (0, express_1.Router)();
function getSenderName(user) {
    return user?.fullName || user?.full_name || user?.email || "Một thành viên";
}
function mapComment(c, myUserId) {
    const votes = (0, voting_1.summarizeVotes)(c.votes ?? [], myUserId);
    return {
        id: c.id,
        content: c.content,
        parentId: c.parentId,
        createdAt: c.createdAt.toISOString(),
        author: c.author,
        votes,
        likesCount: votes.likesCount,
        dislikesCount: votes.dislikesCount,
    };
}
/**
 * POST /api/comments
 * Tạo bình luận bằng postId từ body
 * Dùng cho frontend nào đang gửi { postId, content, parentId? }
 */
router.post("/", auth_1.authRequired, async (req, res) => {
    try {
        const commentSchema = zod_1.z.object({
            content: zod_1.z.string().min(1, "Nội dung bình luận không được để trống"),
            postId: zod_1.z.string().min(1, "Thiếu postId"),
            parentId: zod_1.z.string().optional().nullable(),
        });
        const parsed = commentSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json(parsed.error.flatten());
        }
        const { content, postId, parentId } = parsed.data;
        const question = await db_1.prisma.question.findFirst({
            where: {
                id: postId,
                deletedAt: null,
            },
            select: {
                id: true,
                title: true,
                authorId: true,
            },
        });
        if (!question) {
            return res.status(404).json({ message: "Không tìm thấy bài viết" });
        }
        if (parentId) {
            const parent = await db_1.prisma.comment.findFirst({
                where: {
                    id: parentId,
                    questionId: postId,
                    deletedAt: null,
                },
                select: {
                    id: true,
                },
            });
            if (!parent) {
                return res.status(400).json({
                    message: "Không tìm thấy bình luận cha",
                });
            }
        }
        const newComment = await db_1.prisma.comment.create({
            data: {
                content,
                questionId: postId,
                authorId: req.user.id,
                parentId: parentId ?? null,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        fullName: true,
                        role: true,
                    },
                },
                votes: {
                    select: {
                        value: true,
                        userId: true,
                    },
                },
            },
        });
        // Notification cho chủ bài viết, không gửi nếu tự bình luận bài của mình
        if (question.authorId !== req.user.id) {
            try {
                const senderName = getSenderName(req.user);
                await db_1.prisma.notification.create({
                    data: {
                        recipientId: question.authorId,
                        senderId: req.user.id,
                        type: "COMMENT",
                        content: `${senderName} đã bình luận về bài viết của bạn`,
                        targetId: postId,
                    },
                });
                console.log("=> [Notification] Đã tạo thông báo COMMENT bài viết.");
            }
            catch (notifError) {
                console.error("⚠️ Lỗi ngầm khi tạo thông báo bình luận bài viết:", notifError);
            }
        }
        return res.status(201).json(mapComment(newComment, req.user.id));
    }
    catch (globalError) {
        console.error("CRITICAL ERROR (Comment sập):", globalError);
        return res.status(500).json({
            error: "Lỗi hệ thống xử lý bình luận",
        });
    }
});
/**
 * POST /api/comments/:id/vote
 * Like/dislike bình luận
 */
router.post("/:id/vote", auth_1.authRequired, async (req, res) => {
    try {
        const schema = zod_1.z.object({
            value: zod_1.z.union([zod_1.z.literal(-1), zod_1.z.literal(0), zod_1.z.literal(1)]),
        });
        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json(parsed.error.flatten());
        }
        const commentId = String(req.params.id);
        const c = await db_1.prisma.comment.findFirst({
            where: {
                id: commentId,
                deletedAt: null,
            },
            select: {
                id: true,
                authorId: true,
                questionId: true,
            },
        });
        if (!c) {
            return res.status(404).json({ message: "Not found" });
        }
        const value = parsed.data.value;
        if (value === 0) {
            await db_1.prisma.vote.deleteMany({
                where: {
                    userId: req.user.id,
                    commentId,
                },
            });
        }
        else {
            await db_1.prisma.vote.upsert({
                where: {
                    userId_commentId: {
                        userId: req.user.id,
                        commentId,
                    },
                },
                update: {
                    value,
                },
                create: {
                    userId: req.user.id,
                    commentId,
                    value,
                },
            });
            // Notification khi like comment, không gửi nếu tự like comment của mình
            if (value === 1 && c.authorId !== req.user.id) {
                try {
                    const senderName = getSenderName(req.user);
                    await db_1.prisma.notification.create({
                        data: {
                            recipientId: c.authorId,
                            senderId: req.user.id,
                            type: "LIKE",
                            content: `${senderName} đã thích bình luận của bạn`,
                            targetId: c.questionId,
                        },
                    });
                    console.log("=> [Notification] Đã tạo thông báo LIKE bình luận.");
                }
                catch (notifError) {
                    console.error("⚠️ Lỗi ngầm khi tạo thông báo tương tác Vote:", notifError);
                }
            }
        }
        const votes = await db_1.prisma.vote.findMany({
            where: {
                commentId,
            },
            select: {
                value: true,
                userId: true,
            },
        });
        return res.json({
            ok: true,
            votes: (0, voting_1.summarizeVotes)(votes, req.user.id),
        });
    }
    catch (globalError) {
        console.error("CRITICAL ERROR (Vote comment sập):", globalError);
        return res.status(500).json({
            error: "Lỗi hệ thống xử lý vote bình luận",
        });
    }
});
exports.commentsRouter = router;

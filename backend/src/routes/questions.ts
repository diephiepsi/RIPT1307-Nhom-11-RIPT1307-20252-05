import { Router } from "express";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

import { prisma } from "../db";
import { authOptional, authRequired } from "../middlewares/auth";
import { summarizeVotes } from "../utils/voting";
import { sendMail } from "../services/mail";

const router = Router();

const NO_USER_ID = "__NO_USER__";

function getSenderName(user: any) {
  return user?.fullName || user?.full_name || user?.email || "Một thành viên";
}

function mapQuestionListItem(x: any, myUserId?: string) {
  const votes = summarizeVotes(x.votes ?? [], myUserId);
  const commentsCount = x._count?.comments ?? x.comments?.length ?? 0;
  const viewsCount = x.viewsCount ?? 0;
  const isBookmarked = Boolean(x.bookmarks?.length);

  const hotScore =
    votes.likesCount * 3 +
    commentsCount * 2 +
    viewsCount -
    votes.dislikesCount * 2;

  return {
    id: x.id,
    title: x.title,
    createdAt: x.createdAt.toISOString(),
    updatedAt: x.updatedAt ? x.updatedAt.toISOString() : null,
    author: x.author,
    tags: (x.tags ?? []).map((t: any) => t.tag),

    votes,
    likesCount: votes.likesCount,
    dislikesCount: votes.dislikesCount,

    answersCount: commentsCount,
    commentsCount,
    viewsCount,
    isBookmarked,
    hotScore,
  };
}

function mapComment(c: any, myUserId?: string) {
  const votes = summarizeVotes(c.votes ?? [], myUserId);

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
 * GET /api/questions
 * Lấy danh sách câu hỏi đã duyệt
 */
router.get("/", authOptional, async (req, res) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : undefined;
    const tag = typeof req.query.tag === "string" ? req.query.tag.trim() : undefined;
    const sort = typeof req.query.sort === "string" ? req.query.sort : "newest";
    const status = typeof req.query.status === "string" ? req.query.status : "all";
    const onlyBookmarked = req.query.bookmarked === "true";

    const where: Prisma.QuestionWhereInput = {
      deletedAt: null,
      isApproved: true,

      ...(q
        ? {
            OR: [{ title: { contains: q } }, { content: { contains: q } }],
          }
        : {}),

      ...(tag
        ? {
            tags: {
              some: {
                tag: {
                  name: tag,
                },
              },
            },
          }
        : {}),

      ...(onlyBookmarked && req.user?.id
        ? {
            bookmarks: {
              some: {
                userId: req.user.id,
              },
            },
          }
        : {}),
    };

    const questions = await prisma.question.findMany({
      where,
      orderBy:
        sort === "oldest"
          ? { createdAt: "asc" }
          : sort === "views"
            ? { viewsCount: "desc" }
            : { createdAt: "desc" },

      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            role: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        votes: {
          select: {
            value: true,
            userId: true,
          },
        },
        bookmarks: {
          where: {
            userId: req.user?.id ?? NO_USER_ID,
          },
          select: {
            id: true,
          },
        },
        _count: {
          select: {
            comments: {
              where: {
                deletedAt: null,
              },
            },
          },
        },
      },
    });

    let rows = questions.map((x) => mapQuestionListItem(x, req.user?.id));

    if (status === "unanswered") {
      rows = rows.filter((x) => x.answersCount === 0);
    }

    if (status === "answered") {
      rows = rows.filter((x) => x.answersCount > 0);
    }

    if (sort === "likes") {
      rows.sort((a, b) => b.likesCount - a.likesCount);
    }

    if (sort === "answers") {
      rows.sort((a, b) => b.answersCount - a.answersCount);
    }

    if (sort === "hot") {
      rows.sort((a, b) => b.hotScore - a.hotScore);
    }

    return res.json(rows);
  } catch (error) {
    console.error("[GET /questions] error:", error);
    return res.status(500).json({ message: "Lỗi lấy danh sách bài viết" });
  }
});

/**
 * GET /api/questions/:id
 * Xem chi tiết câu hỏi
 */
router.get("/:id", authOptional, async (req, res) => {
  try {
    const id = String(req.params.id);

    const q = await prisma.question.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            role: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        votes: {
          select: {
            value: true,
            userId: true,
          },
        },
        bookmarks: {
          where: {
            userId: req.user?.id ?? NO_USER_ID,
          },
          select: {
            id: true,
          },
        },
        comments: {
          where: {
            deletedAt: null,
          },
          orderBy: {
            createdAt: "asc",
          },
          select: {
            id: true,
            content: true,
            parentId: true,
            createdAt: true,
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
        },
      },
    });

    if (!q) {
      return res.status(404).json({ message: "Không tìm thấy bài viết" });
    }

    if (!q.isApproved) {
      if (!req.user || (req.user.role !== "ADMIN" && req.user.id !== q.authorId)) {
        return res.status(403).json({
          message: "Bài viết này đang chờ Quản trị viên duyệt.",
        });
      }
    }

    const votes = summarizeVotes(q.votes, req.user?.id);

    return res.json({
      id: q.id,
      title: q.title,
      content: q.content,
      createdAt: q.createdAt.toISOString(),
      updatedAt: q.updatedAt ? q.updatedAt.toISOString() : null,
      author: q.author,
      tags: q.tags.map((t) => t.tag),
      votes,
      likesCount: votes.likesCount,
      dislikesCount: votes.dislikesCount,
      viewsCount: q.viewsCount ?? 0,
      isBookmarked: Boolean(q.bookmarks?.length),
      comments: q.comments.map((c) => mapComment(c, req.user?.id)),
    });
  } catch (error) {
    console.error("[GET /questions/:id] error:", error);
    return res.status(500).json({ message: "Lỗi lấy chi tiết bài viết" });
  }
});

const createSchema = z.object({
  title: z.string().min(10, "Tiêu đề phải có ít nhất 10 ký tự"),
  content: z.string().min(20, "Nội dung phải có ít nhất 20 ký tự"),
  tags: z.array(z.string().min(1)).min(1, "Phải có ít nhất 1 tag"),
});

/**
 * POST /api/questions
 * Đăng câu hỏi mới
 */
router.post("/", authRequired, async (req, res) => {
  try {
    const parsed = createSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json(parsed.error.flatten());
    }

    const { title, content, tags } = parsed.data;

    const created = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const q = await tx.question.create({
        data: {
          title,
          content,
          authorId: req.user!.id,
        },
      });

      for (const rawTagName of tags) {
        const tagName = rawTagName.trim();
        if (!tagName) continue;

        const t = await tx.tag.upsert({
          where: { name: tagName },
          update: {},
          create: { name: tagName },
        });

        await tx.questionTag.create({
          data: {
            questionId: q.id,
            tagId: t.id,
          },
        });
      }
      return q;
    });

    const recipients = await prisma.user.findMany({
      where: {
        role: "ADMIN",
        locked: false,
      },
      select: {
        email: true,
      },
    });

    await Promise.allSettled(
      recipients.map((u) =>
        sendMail({
          to: u.email,
          subject: "Yêu cầu duyệt bài đăng mới trên diễn đàn",
          html: `
            <p><b>${title}</b></p>
            <p>Vừa có một bài đăng mới đang chờ bạn duyệt.</p>
          `,
        })
      )
    );

    return res.status(201).json({
      id: created.id,
      message: "Đăng câu hỏi thành công, đang chờ duyệt.",
    });
  } catch (error) {
    console.error("[POST /questions] error:", error);
    return res.status(500).json({ message: "Lỗi đăng câu hỏi" });
  }
});

const addCommentSchema = z.object({
  content: z.string().min(1, "Nội dung bình luận không được để trống"),
  parentId: z.string().optional().nullable(),
});

/**
 * POST /api/questions/:id/comments
 * Bình luận hoặc reply trong chi tiết câu hỏi
 */
router.post("/:id/comments", authRequired, async (req, res) => {
  try {
    const parsed = addCommentSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json(parsed.error.flatten());
    }

    const questionId = String(req.params.id);
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({ message: "Tài khoản không hợp lệ hoặc hết phiên đăng nhập." });
    }

    // Kiểm tra tính tồn tại của User trong cơ sở dữ liệu để tránh lỗi P2003
    const userExists = await prisma.user.findUnique({
      where: { id: currentUserId },
    });

    if (!userExists) {
      return res.status(400).json({ message: "Người dùng không tồn tại trên hệ thống." });
    }

    const q = await prisma.question.findFirst({
      where: {
        id: questionId,
        deletedAt: null,
      },
      include: {
        author: {
          select: {
            email: true,
            fullName: true,
          },
        },
      },
    });

    if (!q) {
      return res.status(404).json({ message: "Không tìm thấy câu hỏi" });
    }

    if (parsed.data.parentId) {
      const parent = await prisma.comment.findFirst({
        where: {
          id: parsed.data.parentId,
          questionId,
          deletedAt: null,
        },
        select: { id: true },
      });

      if (!parent) {
        return res.status(400).json({ message: "Không tìm thấy bình luận cha" });
      }
    }

    const c = await prisma.comment.create({
      data: {
        questionId,
        authorId: currentUserId,
        content: parsed.data.content,
        parentId: parsed.data.parentId ?? null,
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

    if (q.authorId !== currentUserId) {
      try {
        const senderName = getSenderName(req.user);
        await prisma.notification.create({
          data: {
            recipientId: q.authorId,
            senderId: currentUserId,
            type: "COMMENT",
            content: `${senderName} đã bình luận về bài viết của bạn`,
            targetId: questionId,
          },
        });
      } catch (notifError) {
        console.error("[notification] comment failed:", notifError);
      }
    }

    void sendMail({
      to: q.author.email,
      subject: "Có người trả lời câu hỏi của bạn",
      html: `
        <p>Chào ${q.author.fullName},</p>
        <p>Có bình luận mới cho câu hỏi: <b>${q.title}</b></p>
      `,
    }).catch((err) => {
      console.error("[mail] comment notification failed:", err?.message || err);
    });

    return res.status(201).json(mapComment(c, currentUserId));
  } catch (error) {
    console.error("[POST /questions/:id/comments] error:", error);
    return res.status(500).json({ message: "Lỗi bình luận" });
  }
});

/**
 * POST /api/questions/:id/vote
 * Like/dislike bài viết
 */
router.post("/:id/vote", authRequired, async (req, res) => {
  try {
    const schema = z.object({
      value: z.union([z.literal(-1), z.literal(0), z.literal(1)]),
    });

    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json(parsed.error.flatten());
    }

    const questionId = String(req.params.id);

    const q = await prisma.question.findFirst({
      where: {
        id: questionId,
        deletedAt: null,
      },
      select: {
        id: true,
        authorId: true,
      },
    });

    if (!q) {
      return res.status(404).json({ message: "Not found" });
    }

    const value = parsed.data.value;

    if (value === 0) {
      await prisma.vote.deleteMany({
        where: {
          userId: req.user!.id,
          questionId,
        },
      });
    } else {
      await prisma.vote.upsert({
        where: {
          userId_questionId: {
            userId: req.user!.id,
            questionId,
          },
        },
        update: { value },
        create: {
          userId: req.user!.id,
          questionId,
          value,
        },
      });

      if (value === 1 && q.authorId !== req.user!.id) {
        try {
          const senderName = getSenderName(req.user);
          await prisma.notification.create({
            data: {
              recipientId: q.authorId,
              senderId: req.user!.id,
              type: "LIKE_POST",
              content: `${senderName} đã thích bài viết của bạn`,
              targetId: questionId,
            },
          });
        } catch (notifError) {
          console.error("[notification] like post failed:", notifError);
        }
      }
    }

    const votes = await prisma.vote.findMany({
      where: { questionId },
      select: {
        value: true,
        userId: true,
      },
    });

    return res.json({
      ok: true,
      votes: summarizeVotes(votes, req.user!.id),
    });
  } catch (error) {
    console.error("[POST /questions/:id/vote] error:", error);
    return res.status(500).json({ message: "Lỗi vote bài viết" });
  }
});

/**
 * POST /api/questions/:id/view
 * Tăng lượt xem bài viết
 */
router.post("/:id/view", async (req, res) => {
  try {
    const questionId = String(req.params.id);

    const q = await prisma.question.updateMany({
      where: {
        id: questionId,
        deletedAt: null,
        isApproved: true,
      },
      data: {
        viewsCount: {
          increment: 1,
        },
      },
    });

    if (q.count === 0) {
      return res.status(404).json({ message: "Not found" });
    }

    const updated = await prisma.question.findUnique({
      where: { id: questionId },
      select: { viewsCount: true },
    });

    return res.json({
      ok: true,
      viewsCount: updated?.viewsCount ?? 0,
    });
  } catch (error) {
    console.error("[POST /questions/:id/view] error:", error);
    return res.status(500).json({ message: "Lỗi tăng lượt xem" });
  }
});

/**
 * POST /api/questions/:id/bookmark
 * Lưu / bỏ lưu bài viết
 */
router.post("/:id/bookmark", authRequired, async (req, res) => {
  try {
    const questionId = String(req.params.id);

    const q = await prisma.question.findFirst({
      where: {
        id: questionId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!q) {
      return res.status(404).json({ message: "Not found" });
    }

    const existed = await prisma.bookmark.findUnique({
      where: {
        userId_questionId: {
          userId: req.user!.id,
          questionId,
        },
      },
    });

    if (existed) {
      await prisma.bookmark.delete({
        where: { id: existed.id },
      });

      return res.json({
        ok: true,
        isBookmarked: false,
      });
    }

    await prisma.bookmark.create({
      data: {
        userId: req.user!.id,
        questionId,
      },
    });

    return res.json({
      ok: true,
      isBookmarked: true,
    });
  } catch (error) {
    console.error("[POST /questions/:id/bookmark] error:", error);
    return res.status(500).json({ message: "Lỗi lưu bài viết" });
  }
});

export const questionsRouter = router;
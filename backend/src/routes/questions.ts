import { Router } from 'express';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '../db';
import { authOptional, authRequired } from '../middlewares/auth';
import { summarizeVotes } from '../utils/voting';
import { sendMail } from '../services/mail';

const router = Router();

router.get('/', authOptional, async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q : undefined;
  const tag = typeof req.query.tag === 'string' ? req.query.tag : undefined;

  const questions = await prisma.question.findMany({
    where: {
      deletedAt: null,
      ...(q
        ? {
            OR: [{ title: { contains: q } }, { content: { contains: q } }],
          }
        : {}),
      ...(tag
        ? {
            tags: { some: { tag: { name: tag } } },
          }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      author: { select: { id: true, fullName: true, role: true } },
      tags: { include: { tag: true } },
      votes: { select: { value: true, userId: true } },
      _count: { select: { comments: true } },
    },
  });

  res.json(
    questions.map((x: typeof questions[number]) => ({
      id: x.id,
      title: x.title,
      createdAt: x.createdAt.toISOString(),
      author: x.author,
      tags: x.tags.map((t: (typeof x.tags)[number]) => t.tag),
      votes: summarizeVotes(x.votes, req.user?.id),
      answersCount: x._count.comments,
    })),
  );
});

router.get('/:id', authOptional, async (req, res) => {
  const id = String(req.params.id);
  const q = await prisma.question.findFirst({
    where: { id, deletedAt: null },
    include: {
      author: { select: { id: true, fullName: true, role: true } },
      tags: { include: { tag: true } },
      votes: { select: { value: true, userId: true } },
      comments: {
        where: { deletedAt: null },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          content: true,
          parentId: true,
          createdAt: true,
          author: { select: { id: true, fullName: true, role: true } },
          votes: { select: { value: true, userId: true } },
        },
      },
    },
  });
  if (!q) return res.status(404).json({ message: 'Not found' });

  res.json({
    id: q.id,
    title: q.title,
    content: q.content,
    createdAt: q.createdAt.toISOString(),
    author: q.author,
    tags: q.tags.map((t: (typeof q.tags)[number]) => t.tag),
    votes: summarizeVotes(q.votes, req.user?.id),
    comments: q.comments.map((c: (typeof q.comments)[number]) => ({
      id: c.id,
      content: c.content,
      parentId: c.parentId,
      createdAt: c.createdAt.toISOString(),
      author: c.author,
      votes: summarizeVotes(c.votes, req.user?.id),
    })),
  });
});

const createSchema = z.object({
  title: z.string().min(10),
  content: z.string().min(20),
  tags: z.array(z.string().min(1)).min(1),
});

router.post('/', authRequired, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const { title, content, tags } = parsed.data;

  const created = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const q = await tx.question.create({
      data: {
        title,
        content,
        authorId: req.user!.id,
      },
    });

    for (const tagName of tags) {
      const t = await tx.tag.upsert({
        where: { name: tagName },
        update: {},
        create: { name: tagName },
      });
      await tx.questionTag.create({ data: { questionId: q.id, tagId: t.id } });
    }

    return q;
  });

  // notify admins/lecturers (simple demo: send to all lecturers + admins)
  const recipients = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'LECTURER'] }, locked: false },
    select: { email: true },
  });
  await Promise.allSettled(
    recipients.map((u: (typeof recipients)[number]) =>
      sendMail({
        to: u.email,
        subject: 'Có bài đăng mới trên diễn đàn',
        html: `<p><b>${title}</b></p><p>Vừa có bài đăng mới. Vào hệ thống để xem chi tiết.</p>`,
      }),
    ),
  );

  const detail = await prisma.question.findFirst({
    where: { id: created.id },
    include: { author: { select: { id: true, fullName: true, role: true } }, tags: { include: { tag: true } }, votes: true, comments: true },
  });
  if (!detail) return res.status(500).json({ message: 'Create failed' });

  res.status(201).json({
    id: detail.id,
    title: detail.title,
    content: detail.content,
    createdAt: detail.createdAt.toISOString(),
    author: detail.author,
    tags: detail.tags.map((t: (typeof detail.tags)[number]) => t.tag),
    votes: summarizeVotes([], req.user?.id),
    comments: [],
  });
});

const addCommentSchema = z.object({
  content: z.string().min(1),
  parentId: z.string().optional(),
});

router.post('/:id/comments', authRequired, async (req, res) => {
  const parsed = addCommentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const questionId = String(req.params.id);

  const q = await prisma.question.findFirst({
    where: { id: questionId, deletedAt: null },
    include: { author: { select: { email: true, fullName: true } } },
  });
  if (!q) return res.status(404).json({ message: 'Not found' });

  if (parsed.data.parentId) {
    const parent = await prisma.comment.findFirst({
      where: { id: parsed.data.parentId, questionId, deletedAt: null },
    });
    if (!parent) return res.status(400).json({ message: 'Parent comment not found' });
  }

  const c = await prisma.comment.create({
    data: {
      questionId,
      authorId: req.user!.id,
      content: parsed.data.content,
      parentId: parsed.data.parentId ?? null,
    },
  });

  // notify question author
  await sendMail({
    to: q.author.email,
    subject: 'Có người trả lời bình luận/câu hỏi của bạn',
    html: `<p>Chào ${q.author.fullName},</p><p>Có bình luận mới cho câu hỏi: <b>${q.title}</b></p>`,
  });

  res.status(201).json({ id: c.id });
});

router.post('/:id/vote', authRequired, async (req, res) => {
  const schema = z.object({ value: z.union([z.literal(-1), z.literal(0), z.literal(1)]) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const questionId = String(req.params.id);

  const q = await prisma.question.findFirst({ where: { id: questionId, deletedAt: null }, select: { id: true } });
  if (!q) return res.status(404).json({ message: 'Not found' });

  const value = parsed.data.value;
  if (value === 0) {
    await prisma.vote.deleteMany({ where: { userId: req.user!.id, questionId } });
  } else {
    await prisma.vote.upsert({
      where: { userId_questionId: { userId: req.user!.id, questionId } },
      update: { value },
      create: { userId: req.user!.id, questionId, value },
    });
  }
  res.json({ ok: true });
});

export const questionsRouter = router;


import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';


import './types';
import { authRouter } from './routes/auth';
import { tagsRouter } from './routes/tags';
import { questionsRouter } from './routes/questions';
import { commentsRouter } from './routes/comments';
import { adminRouter } from './routes/admin';
import { notificationRoutes } from './routes/notifications';

const app = express();

app.use('/api/notifications', notificationRoutes);
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

app.get('/', (_req, res) => {
  res.json({
    name: 'Student Q&A API',
    health: '/api/health',
    posts: '/api/posts',
    questions: '/api/questions',
  });
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRouter);
app.use('/api/tags', tagsRouter);
// Bài đăng (câu hỏi) — alias /posts khớp tên bảng MySQL & frontend
app.use('/api/posts', questionsRouter);
app.use('/api/questions', questionsRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/notifications', notificationRoutes);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({
    message: err instanceof Error ? err.message : 'Internal server error',
  });
});

const port = Number(process.env.PORT ?? '3000');
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});


"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
require("./types");
const auth_1 = require("./routes/auth");
const tags_1 = require("./routes/tags");
const questions_1 = require("./routes/questions");
const comments_1 = require("./routes/comments");
const admin_1 = require("./routes/admin");
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({ origin: true, credentials: true }));
app.use(express_1.default.json({ limit: '2mb' }));
app.use((0, morgan_1.default)('dev'));
app.get('/', (_req, res) => {
    res.json({
        name: 'Student Q&A API',
        health: '/api/health',
        posts: '/api/posts',
        questions: '/api/questions',
    });
});
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', auth_1.authRouter);
app.use('/api/tags', tags_1.tagsRouter);
// Bài đăng (câu hỏi) — alias /posts khớp tên bảng MySQL & frontend
app.use('/api/posts', questions_1.questionsRouter);
app.use('/api/questions', questions_1.questionsRouter);
app.use('/api/comments', comments_1.commentsRouter);
app.use('/api/admin', admin_1.adminRouter);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({
        message: err instanceof Error ? err.message : 'Internal server error',
    });
});
const port = Number(process.env.PORT ?? '3000');
app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
});

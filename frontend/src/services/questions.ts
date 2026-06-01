import { api } from './api';
import type { QuestionDetail, QuestionListItem, Tag } from '../models/qa';

/** API bài đăng — backend mount tại /api/posts (và /api/questions) */
const POSTS = '/posts';

export const questionsService = {
  async list(params: { q?: string; tag?: string } = {}) {
    const { data } = await api.get<QuestionListItem[]>(POSTS, { params });
    return data;
  },
  async get(id: string) {
    const { data } = await api.get<QuestionDetail>(`${POSTS}/${id}`);
    return data;
  },
  async create(payload: { title: string; content: string; tags: string[] }) {
    const { data } = await api.post<QuestionDetail>(POSTS, payload);
    return data;
  },
  async addComment(questionId: string, payload: { content: string; parentId?: string }) {
    const { data } = await api.post(`${POSTS}/${questionId}/comments`, payload);
    return data;
  },
  async voteQuestion(questionId: string, value: -1 | 0 | 1) {
    const { data } = await api.post(`${POSTS}/${questionId}/vote`, { value });
    return data;
  },
  async voteComment(commentId: string, value: -1 | 0 | 1) {
    const { data } = await api.post(`/comments/${commentId}/vote`, { value });
    return data;
  },
  async tags() {
    const { data } = await api.get<Tag[]>('/tags');
    return data;
  },
};


import { api } from "./api";
import type {
  CommentItem,
  QuestionDetail,
  QuestionListItem,
  Tag,
  VoteSummary,
} from "../types/qa"; // Đã đổi từ models/qa sang types/qa

export type QuestionSort =
  | "newest"
  | "oldest"
  | "hot"
  | "likes"
  | "answers"
  | "views";
export type QuestionStatus = "all" | "answered" | "unanswered";

export const questionsService = {
  async list(params?: {
    q?: string;
    tag?: string;
    sort?: QuestionSort;
    status?: QuestionStatus;
    bookmarked?: boolean;
  }) {
    const res = await api.get<QuestionListItem[]>("/questions", { params });
    return res.data;
  },

  async detail(id: string) {
    const res = await api.get<QuestionDetail>(`/questions/${id}`);
    return res.data;
  },

  async create(payload: { title: string; content: string; tags: string[] }) {
    const res = await api.post("/questions", payload);
    return res.data;
  },

  async addComment(
    id: string,
    payload: { content: string; parentId?: string },
  ) {
    const res = await api.post<CommentItem>(
      `/questions/${id}/comments`,
      payload,
    );
    return res.data;
  },

  async vote(id: string, value: -1 | 0 | 1) {
    const res = await api.post<{ ok: boolean; votes: VoteSummary }>(
      `/questions/${id}/vote`,
      { value },
    );
    return res.data;
  },

  async view(id: string) {
    const res = await api.post(`/questions/${id}/view`);
    return res.data;
  },

  async bookmark(id: string) {
    const res = await api.post<{ ok: boolean; isBookmarked: boolean }>(
      `/questions/${id}/bookmark`,
    );
    return res.data;
  },

  async tags() {
    const res = await api.get<Tag[]>("/tags");
    return res.data;
  },
};
export type Role = "STUDENT" | "LECTURER" | "ADMIN";

export interface UserLite {
  id: string;
  fullName: string;
  role: Role;
}

export interface Tag {
  id: string;
  name: string;
}

export interface VoteSummary {
  likesCount: number;
  dislikesCount: number;
  score: number;
  myVote: -1 | 0 | 1;
  up?: number;
  down?: number;
}

export interface QuestionListItem {
  id: string;
  title: string;
  createdAt: string;
  updatedAt?: string;
  author: UserLite;
  tags: Tag[];
  votes: VoteSummary;
  likesCount?: number;
  dislikesCount?: number;
  answersCount: number;
  commentsCount?: number;
  viewsCount?: number;
  isBookmarked?: boolean;
  hotScore?: number;
}

export interface CommentItem {
  id: string;
  content: string;
  parentId?: string | null;
  createdAt: string;
  author: UserLite;
  votes: VoteSummary;
  likesCount?: number;
  dislikesCount?: number;
}

export interface QuestionDetail extends QuestionListItem {
  content: string;
  comments: CommentItem[];
}

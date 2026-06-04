export interface Tag {
  id: string;
  name: string;
}

export interface VoteSummary {
  up: number;
  down: number;
  score: number;
  myVote: -1 | 0 | 1;
}

export interface QuestionListItem {
  id: string;
  title: string;
  createdAt: string;
  author: { id: string; fullName: string; role: string };
  tags: Tag[];
  votes: VoteSummary;
  answersCount: number;
}

export interface CommentItem {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; fullName: string; role: string };
  votes: VoteSummary;
}

export interface QuestionDetail {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author: { id: string; fullName: string; role: string };
  tags: Tag[];
  votes: VoteSummary;
  comments: CommentItem[];
}


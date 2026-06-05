import type { Vote } from "@prisma/client";

export type VoteSummary = {
  likesCount: number;
  dislikesCount: number;
  score: number;
  myVote: -1 | 0 | 1;
  up: number;
  down: number;
};

export function summarizeVotes(
  votes: Pick<Vote, "value" | "userId">[],
  myUserId?: string,
): VoteSummary {
  let likesCount = 0;
  let dislikesCount = 0;
  let myVote: -1 | 0 | 1 = 0;

  for (const vote of votes) {
    if (vote.value > 0) likesCount += 1;
    if (vote.value < 0) dislikesCount += 1;

    if (myUserId && vote.userId === myUserId) {
      myVote = vote.value > 0 ? 1 : vote.value < 0 ? -1 : 0;
    }
  }

  return {
    likesCount,
    dislikesCount,
    score: likesCount - dislikesCount,
    myVote,
    // Giữ tương thích code cũ nếu frontend/admin đang dùng up/down
    up: likesCount,
    down: dislikesCount,
  };
}

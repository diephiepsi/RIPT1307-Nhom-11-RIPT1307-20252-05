import type { Vote } from '@prisma/client';

export function summarizeVotes(votes: Pick<Vote, 'value' | 'userId'>[], myUserId?: string) {
  let up = 0;
  let down = 0;
  let myVote: -1 | 0 | 1 = 0;
  for (const v of votes) {
    if (v.value > 0) up += 1;
    if (v.value < 0) down += 1;
    if (myUserId && v.userId === myUserId) myVote = v.value > 0 ? 1 : v.value < 0 ? -1 : 0;
  }
  return { up, down, score: up - down, myVote };
}


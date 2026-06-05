"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.summarizeVotes = summarizeVotes;
function summarizeVotes(votes, myUserId) {
  let up = 0;
  let down = 0;
  let myVote = 0;
  for (const v of votes) {
    if (v.value > 0) up += 1;
    if (v.value < 0) down += 1;
    if (myUserId && v.userId === myUserId)
      myVote = v.value > 0 ? 1 : v.value < 0 ? -1 : 0;
  }
  return { up, down, score: up - down, myVote };
}

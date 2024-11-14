import { VoteData } from "../types";

// 投票データを保持するクラス
class VoteStore {
  private voteMessageMap = new Map<string, VoteData>();

  set(messageTs: string, data: VoteData) {
    this.voteMessageMap.set(messageTs, data);
  }

  get(messageTs: string) {
    return this.voteMessageMap.get(messageTs);
  }

  delete(messageTs: string) {
    return this.voteMessageMap.delete(messageTs);
  }
}

export const voteStore = new VoteStore();

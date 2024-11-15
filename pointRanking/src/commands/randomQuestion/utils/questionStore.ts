import { RandomQuestionData } from "../types";

class QuestionStore {
  private questionMap = new Map<string, RandomQuestionData>();

  set(userId: string, data: RandomQuestionData) {
    this.questionMap.set(userId, data);
  }

  get(userId: string) {
    return this.questionMap.get(userId);
  }

  delete(userId: string) {
    return this.questionMap.delete(userId);
  }
}

export const questionStore = new QuestionStore();

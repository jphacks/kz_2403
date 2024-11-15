import { WebClient } from "@slack/web-api";
import { sendRandomQuestion } from "../commands/randomQuestion/handlers/questionHandler";

export class RandomQuestionScheduler {
  private timeoutId: NodeJS.Timeout | null = null;
  private readonly client: WebClient;
  private readonly channelId: string;

  constructor(client: WebClient, channelId: string) {
    this.client = client;
    this.channelId = channelId;
  }

  private getRandomInterval(): number {
    const minInterval = 4 * 60 * 60 * 1000; // 4時間
    const maxInterval = 8 * 60 * 60 * 1000; // 8時間
    return (
      Math.floor(Math.random() * (maxInterval - minInterval)) + minInterval
    );
  }

  private isWorkingHours(): boolean {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();

    if (day === 0 || day === 6) return false; // 土日は除外
    return hour >= 9 && hour < 18; // 9時から18時の間
  }

  start() {
    const scheduleNext = () => {
      if (this.isWorkingHours()) {
        this.executeRandomQuestion();
      }

      const nextInterval = this.getRandomInterval();
      this.timeoutId = setTimeout(scheduleNext, nextInterval);
    };

    scheduleNext();
  }

  stop() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  private async executeRandomQuestion() {
    try {
      await sendRandomQuestion(this.client, this.channelId);
    } catch (error) {
      console.error("自動ランダム質問の実行に失敗:", error);
    }
  }
}

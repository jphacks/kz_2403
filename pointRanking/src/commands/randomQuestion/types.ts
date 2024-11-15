import { SlackCommandMiddlewareArgs } from "@slack/bolt";
import { WebClient } from "@slack/web-api";

export interface RandomQuestionData {
  channelId: string;
  question: string;
  targetUserId: string;
  endTime: number;
  isAnswered: boolean;
}

export interface ExtendedSlackCommandMiddlewareArgs
  extends SlackCommandMiddlewareArgs {
  client: WebClient;
}

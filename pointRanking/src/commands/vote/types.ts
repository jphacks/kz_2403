import { SlackCommandMiddlewareArgs } from "@slack/bolt";
import { WebClient } from "@slack/web-api";

// 投票の型
export interface VoteData {
  channelId: string;
  options: string[];
  votes: Map<string, Set<string>>;
  endTime: number;
  imageUrl?: string;
}

export interface ExtendedSlackCommandMiddlewareArgs
  extends SlackCommandMiddlewareArgs {
  client: WebClient;
}

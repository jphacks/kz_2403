import { SlackCommandMiddlewareArgs } from "@slack/bolt";
import { WebClient } from "@slack/web-api";

export interface ExtendedSlackCommandMiddlewareArgs
  extends SlackCommandMiddlewareArgs {
  client: WebClient;
}

import { App } from "@slack/bolt";
import { WebClient } from "@slack/web-api";

export interface SlackCommandProps {
  slackBot: App;
  slackClient: WebClient;
}
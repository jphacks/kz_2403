import {
  SlackCommandMiddlewareArgs,
  SlackViewMiddlewareArgs,
  ViewSubmitAction,
} from "@slack/bolt";
import { handleDecorateCommand } from "./handlers/handleDecorateCommand";
import { handleDecorateModalSubmission } from "./handlers/handleDecorateModalSubmission";
import { WebClient } from "@slack/web-api";

export default function decorateCommand(slackBot: any) {
  slackBot.command(
    "/decorate",
    async (args: SlackCommandMiddlewareArgs & { client: WebClient }) => {
      await handleDecorateCommand(args);
    }
  );

  slackBot.view(
    "decorate_modal",
    async (
      args: SlackViewMiddlewareArgs<ViewSubmitAction> & { client: WebClient }
    ) => {
      await handleDecorateModalSubmission(args);
    }
  );
}

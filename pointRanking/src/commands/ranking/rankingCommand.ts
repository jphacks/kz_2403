import {
  SlackCommandMiddlewareArgs,
  SlackActionMiddlewareArgs,
  BlockAction,
} from "@slack/bolt";
import monthRankingCommand from "./monthRankingCommand";
import totalPointsCommand from "./totalPointsCommand";
import myPointsCommand from "./myPointsCommand";
import { WebClient } from "@slack/web-api";

const channelMap = new Map<string, string>();

export default function rankingCommand(
  slackBot: any,
  supabase: any,
  workspaceId: string
) {
  const { handleMonthRanking } = monthRankingCommand(slackBot, supabase);
  const { handleTotalPoints } = totalPointsCommand(slackBot, supabase);
  const { handleMyPoints } = myPointsCommand(slackBot, supabase);

  slackBot.command(
    "/ranking",
    async ({
      command,
      ack,
      client,
    }: SlackCommandMiddlewareArgs & { client: any }) => {
      await ack();
      try {
        channelMap.set(command.user_id, command.channel_id);
        await client.views.open({
          trigger_id: command.trigger_id,
          view: {
            type: "modal",
            callback_id: "ranking_modal",
            title: {
              type: "plain_text",
              text: "現在のランキング",
            },
            blocks: [
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: "以下のオプションから選んでください：",
                },
              },
              {
                type: "actions",
                elements: [
                  {
                    type: "button",
                    text: {
                      type: "plain_text",
                      text: "累計",
                    },
                    action_id: "button_total",
                  },
                  {
                    type: "button",
                    text: {
                      type: "plain_text",
                      text: "月間",
                    },
                    action_id: "button_monthly",
                  },
                  {
                    type: "button",
                    text: {
                      type: "plain_text",
                      text: "個人",
                    },
                    action_id: "button_my",
                  },
                  {
                    type: "button",
                    text: {
                      type: "plain_text",
                      text: "シークレット",
                    },
                    action_id: "button_secret",
                  },
                ],
              },
            ],
          },
        });
      } catch (error) {
        console.error("モーダル表示エラー:", error);
      }
    }
  );

  slackBot.action(
    "button_total",
    async ({
      ack,
      body,
      client,
    }: SlackActionMiddlewareArgs<BlockAction> & { client: WebClient }) => {
      await ack();
      const channelId = channelMap.get(body.user.id);
      if (channelId) {
        await handleTotalPoints(client, channelId, workspaceId);
        channelMap.delete(body.user.id);
      }
    }
  );

  slackBot.action(
    "button_monthly",
    async ({
      ack,
      body,
      client,
    }: SlackActionMiddlewareArgs<BlockAction> & { client: any }) => {
      await ack();
      const channelId = channelMap.get(body.user.id);
      if (channelId) {
        await handleMonthRanking(client, channelId, workspaceId);
        channelMap.delete(body.user.id);
      }
    }
  );

  slackBot.action(
    "button_my",
    async ({
      ack,
      body,
      client,
    }: SlackActionMiddlewareArgs<BlockAction> & { client: WebClient }) => {
      await ack();
      const channelId = channelMap.get(body.user.id);
      if (channelId) {
        await handleMyPoints(client, channelId, body.user.id, workspaceId); // workspaceIdを追加
        channelMap.delete(body.user.id);
      }
    }
  );

  slackBot.action(
    "button_secret",
    async ({
      ack,
      body,
      client,
    }: SlackActionMiddlewareArgs<BlockAction> & { client: any }) => {
      await ack();
      const channelId = channelMap.get(body.user.id);
      if (channelId) {
        await client.chat.postMessage({
          channel: channelId,
          text: "シークレット情報は現在非公開です。",
        });
        channelMap.delete(body.user.id);
      }
    }
  );
}

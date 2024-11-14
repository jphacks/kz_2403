import {
  BlockAction,
  SlackActionMiddlewareArgs,
  SlackCommandMiddlewareArgs,
  SlackViewMiddlewareArgs,
  ViewSubmitAction,
} from "@slack/bolt";
import { SlackCommandProps } from "../command";
import { WebClient } from "@slack/web-api";

export default function questionCommand(
  { slackBot, slackClient }: SlackCommandProps,
) {
  slackBot.command(
    "/question",
    async ({ command, ack }: SlackCommandMiddlewareArgs) => {
      try {
        await ack();

        await slackClient.views.open({
          trigger_id: command.trigger_id, // モーダルを開くために必要なトリガーID
          view: {
            type: "modal",
            callback_id: "question_modal",
            private_metadata: command.channel_id, // モーダルがどのチャンネルからトリガーされたのかを特定するための情報
            title: {
              type: "plain_text",
              text: "質問を投稿",
            },
            blocks: [
              {
                type: "input",
                block_id: "question_input",
                element: {
                  type: "plain_text_input",
                  action_id: "input",
                  placeholder: {
                    type: "plain_text",
                    text: "質問を入力してください",
                  },
                },
                label: {
                  type: "plain_text",
                  text: "質問内容",
                },
              },
            ],
            submit: {
              type: "plain_text",
              text: "投稿",
            },
          },
        });
      } catch (error) {
        console.error("エラー: モーダルが開けません:", error);
      }
    },
  );

  slackBot.view(
    "question_modal",
    async (
      { ack, view, client }: SlackViewMiddlewareArgs<ViewSubmitAction> & {
        client: WebClient;
      },
    ) => {
      try {
        await ack();
        const question = view.state.values.question_input.input.value;
        const channelId = view.private_metadata;

        if (!channelId) {
          throw new Error("チャンネルIDが見つかりません");
        }

        await client.chat.postMessage({
          channel: channelId,
          text: `@channel 新しい質問が投稿されました！\n${question}`,
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `@channel 新しい質問が投稿されました！\n${question}`,
              },
            },
            {
              type: "actions",
              elements: [
                {
                  type: "button",
                  text: {
                    type: "plain_text",
                    text: "回答する",
                  },
                  action_id: "reply_button",
                },
              ],
            },
          ],
        });
      } catch (error) {
        console.error(error);
      }
    },
  );

  slackBot.view(
    "reply_modal",
    async (
      { ack, body, view, client }: SlackViewMiddlewareArgs<ViewSubmitAction> & {
        client: WebClient;
      },
    ) => {
      try {
        await ack();
        const reply = view.state.values.reply_input.input.value;
        const userId = body.user.id;

        // private_metadata から情報を取得
        const metadata = JSON.parse(view.private_metadata);
        const channelId = metadata.channelId;
        const messageTs = metadata.messageTs;

        // 回答を元のメッセージのスレッドに投稿
        await client.chat.postMessage({
          channel: channelId,
          thread_ts: messageTs,
          text: `<@${userId}> さんの回答:\n${reply}`,
        });
      } catch (error) {
        console.error(error);
      }
    },
  );

  slackBot.action(
    "reply_button",
    async (
      { ack, body, client }: SlackActionMiddlewareArgs<BlockAction> & {
        client: WebClient;
      },
    ) => {
      try {
        await ack();
        const channelId = body.channel?.id;
        const messageTs = body.message?.ts; // メッセージのタイムスタンプ

        if (!channelId || !messageTs) {
          throw new Error("チャンネルIDまたはメッセージIDが見つかりません");
        }

        // モーダルを開くときに必要な情報を渡す
        await client.views.open({
          trigger_id: body.trigger_id,
          view: {
            type: "modal",
            callback_id: "reply_modal",
            private_metadata: JSON.stringify({ channelId, messageTs }),
            title: {
              type: "plain_text",
              text: "回答を投稿",
            },
            blocks: [
              {
                type: "input",
                block_id: "reply_input",
                element: {
                  type: "plain_text_input",
                  action_id: "input",
                  multiline: true,
                },
                label: {
                  type: "plain_text",
                  text: "回答内容",
                },
              },
            ],
            submit: {
              type: "plain_text",
              text: "送信",
            },
          },
        });
      } catch (error) {
        console.error(error);
      }
    },
  );
}

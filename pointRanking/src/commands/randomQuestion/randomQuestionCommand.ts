import {
  SlackActionMiddlewareArgs,
  BlockAction,
  ViewSubmitAction,
  SlackCommandMiddlewareArgs,
} from "@slack/bolt";
import { WebClient } from "@slack/web-api";
import { SlackCommandProps } from "../command";
import { questionStore } from "./utils/questionStore";
import { handleQuestionAnswerSubmission } from "./handlers/modalHandler";
import { sendRandomQuestion } from "./handlers/questionHandler";

const TARGET_CHANNEL_ID = "C080L8HGB47"; // 固定するチャンネルID

export default function randomQuestionCommand({ slackBot }: SlackCommandProps) {
  // 回答ボタンのハンドラー
  slackBot.action(
    "answer_random_question",
    async ({
      ack,
      body,
      client,
    }: SlackActionMiddlewareArgs<BlockAction> & { client: WebClient }) => {
      ack();

      const userId = body.user?.id;
      if (!userId) {
        console.error("ユーザーIDが見つかりません");
        return;
      }

      const questionData = questionStore.get(userId);
      if (!questionData) {
        return;
      }

      await client.views.open({
        trigger_id: body.trigger_id,
        view: {
          type: "modal",
          callback_id: "answer_modal",
          title: {
            type: "plain_text",
            text: "質問に回答",
          },
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*質問*\n${questionData.question}`,
              },
            },
            {
              type: "input",
              block_id: "answer_input",
              element: {
                type: "plain_text_input",
                action_id: "answer",
                multiline: true,
              },
              label: {
                type: "plain_text",
                text: "回答",
              },
            },
          ],
          submit: {
            type: "plain_text",
            text: "回答を送信",
          },
        },
      });
    }
  );

  // 回答モーダル送信ハンドラー
  slackBot.view<ViewSubmitAction>("answer_modal", async (args) => {
    await handleQuestionAnswerSubmission(args);
  });

  // /random_question コマンドハンドラー
  slackBot.command(
    "/random_question",
    async ({
      command,
      ack,
      client,
    }: SlackCommandMiddlewareArgs & { client: WebClient }) => {
      await ack();

      try {
        await sendRandomQuestion(client, TARGET_CHANNEL_ID);
      } catch (error) {
        console.error("ランダム質問の送信に失敗しました:", error);
        await client.chat.postMessage({
          channel: TARGET_CHANNEL_ID,
          text: "ランダム質問の送信に失敗しました。もう一度お試しください。",
        });
      }
    }
  );
}

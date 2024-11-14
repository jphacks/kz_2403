import { SlackCommandMiddlewareArgs } from "@slack/bolt";
import { SlackCommandProps } from "../command";
import { WebClient } from "@slack/web-api";

interface ExtendedSlackCommandMiddlewareArgs extends SlackCommandMiddlewareArgs {
  client: WebClient;
}

interface VoteOptions {
  [key: string]: number;
}

export default function voteCommand({slackBot, slackClient}: SlackCommandProps) {
  slackBot.command("/vote", async ({ command, ack, client }: ExtendedSlackCommandMiddlewareArgs) => {
    try {
      await ack();
      
      await slackClient.views.open({
        trigger_id: command.trigger_id,
        view: {
          type: "modal",
          callback_id: "vote_modal",
          title: {
            type: "plain_text",
            text: "投票を作成",
          },
          submit: {
            type: "plain_text",
            text: "送信",
          },
          blocks: [
            {
              type: "input",
              block_id: "vote_question_block",
              element: {
                type: "plain_text_input",
                action_id: "vote_question",
                placeholder: {
                  type: "plain_text",
                  text: "投票の質問を入力してください",
                },
              },
              label: {
                type: "plain_text",
                text: "質問",
              },
            },
            {
              type: "input",
              block_id: "vote_option1_block",
              element: {
                type: "plain_text_input",
                action_id: "vote_option1",
                placeholder: {
                  type: "plain_text",
                  text: "選択肢1",
                },
              },
              label: {
                type: "plain_text",
                text: "選択肢1",
              },
            },
            {
              type: "input",
              block_id: "vote_option2_block",
              element: {
                type: "plain_text_input",
                action_id: "vote_option2",
                placeholder: {
                  type: "plain_text",
                  text: "選択肢2",
                },
              },
              label: {
                type: "plain_text",
                text: "選択肢2",
              },
            },
            {
              type: "input",
              block_id: "vote_option3_block",
              optional: true,
              element: {
                type: "plain_text_input",
                action_id: "vote_option3",
                placeholder: {
                  type: "plain_text",
                  text: "選択肢3 (任意)",
                },
              },
              label: {
                type: "plain_text",
                text: "選択肢3",
              },
            },
            {
              type: "input",
              block_id: "vote_option4_block",
              optional: true,
              element: {
                type: "plain_text_input",
                action_id: "vote_option4",
                placeholder: {
                  type: "plain_text",
                  text: "選択肢4 (任意)",
                },
              },
              label: {
                type: "plain_text",
                text: "選択肢4",
              },
            },
          ],
        },
      });
    } catch (error) {
      console.error("投票コマンドのエラー:", error);
    }
  });
} 
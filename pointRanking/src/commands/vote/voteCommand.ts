import {
  BlockAction,
  SlackActionMiddlewareArgs,
  SlackCommandMiddlewareArgs,
  SlackViewMiddlewareArgs,
  ViewSubmitAction,
} from "@slack/bolt";
import { SlackCommandProps } from "../command";
import { handleOptionAddition } from "./handlers/optionHandler";
import { handleVoteModalSubmission } from "./handlers/modalHandler";
import { handleVote } from "./handlers/voteHandler";

export default function voteCommand({
  slackBot,
}: SlackCommandProps) {
  // /vote コマンドハンドラー
  slackBot.command(
    "/vote",
    async ({ command, ack, client }: SlackCommandMiddlewareArgs & { client: any }) => {
      try {
        await ack();

        // 投票設定モーダルを開く
        await client.views.open({
          trigger_id: command.trigger_id,
          view: {
            type: "modal",
            callback_id: "vote_modal",
            private_metadata: JSON.stringify({
              channelId: command.channel_id,
              optionCount: 2,
            }),
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
                type: "actions",
                block_id: "add_option_actions",
                elements: [
                  {
                    type: "button",
                    text: {
                      type: "plain_text",
                      text: "選択肢を追加",
                      emoji: true,
                    },
                    action_id: "add_option_button",
                  },
                ],
              },
            ],
          },
        });
      } catch (error) {
        console.error("投票コマンドのエラー:", error);
      }
    }
  );

  // 選択肢追加ボタンのハンドラー
  slackBot.action(
    "add_option_button",
    async (args: SlackActionMiddlewareArgs<BlockAction> & { client: any }) => {
      await handleOptionAddition(args);
    }
  );

  // 投票モーダル送信ハンドラー
  slackBot.view(
    "vote_modal",
    async (args: SlackViewMiddlewareArgs<ViewSubmitAction> & { client: any }) => {
      await handleVoteModalSubmission(args);
    }
  );

  // 投票アクションハンドラー
  slackBot.action(
    /^vote_option_\d+$/,
    async (args: SlackActionMiddlewareArgs<BlockAction> & { client: any }) => {
      await handleVote(args);
    }
  );
}
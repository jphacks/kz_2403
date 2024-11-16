import {
  BlockAction,
  SlackActionMiddlewareArgs,
  SlackCommandMiddlewareArgs,
  SlackViewMiddlewareArgs,
  ViewSubmitAction,
} from "@slack/bolt";
import { SlackCommandProps } from "../command";
import { ImageBlock, KnownBlock, WebClient } from "@slack/web-api";

export default function questionCommand(
  { slackBot, slackClient }: SlackCommandProps,
) {
  // /question コマンドハンドラー
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
              // 画像アップロード用ブロックを追加
              {
                type: "input",
                block_id: "image_block",
                optional: true,
                element: {
                  type: "file_input",
                  action_id: "question_image",
                  filetypes: ["jpg", "jpeg", "png", "gif"]
                },
                label: {
                  type: "plain_text",
                  text: "画像を追加（任意）",
                }
              }
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
    }
  );

  // 質問モーダル送信ハンドラー
  slackBot.view(
    "question_modal",
    async ({ ack, view, client }: SlackViewMiddlewareArgs<ViewSubmitAction> & { client: WebClient }) => {
      try {
        await ack();
        const question = view.state.values.question_input.input.value;
        const channelId = view.private_metadata;

        // 画像URLを取得
        const imageBlock = view.state.values.image_block?.question_image;
        const files = imageBlock?.files;
        const imageUrl = files?.[0]?.permalink;

        if (!channelId) {
          throw new Error("チャンネルIDが見つかりません");
        }

        const blocks = [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `<!channel> 新しい質問が投稿されました！\n${question}`,
            },
          },
          // 画像がある場合は追加
          ...(imageUrl ? [
            {
              type: "image",
              image_url: imageUrl,
              alt_text: "質問の画像"
            }
          ] : []),
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
        ];

        await client.chat.postMessage({
          channel: channelId,
          text: `@channel 新しい質問が投稿されました！\n${question}`,
          blocks: blocks,
        });
      } catch (error) {
        console.error(error);
      }
    }
  );

  // 回答モーダルを開くハンドラー
  slackBot.action(
    "reply_button",
    async ({ ack, body, client }: SlackActionMiddlewareArgs<BlockAction> & { client: WebClient }) => {
      try {
        await ack();
        const channelId = body.channel?.id;
        const messageTs = body.message?.ts;

        if (!channelId || !messageTs) {
          throw new Error("チャンネルIDまたはメッセージIDが見つかりません");
        }

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
              // 回答用の画像アップロードブロックを追加
              {
                type: "input",
                block_id: "reply_image_block",
                optional: true,
                element: {
                  type: "file_input",
                  action_id: "reply_image",
                  filetypes: ["jpg", "jpeg", "png", "gif"]
                },
                label: {
                  type: "plain_text",
                  text: "画像を追加（任意）",
                }
              }
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
    }
  );

   // メッセージブロックビルダー関数
  function buildMessageBlocks(text: string, imageUrl?: string): KnownBlock[] {
    const blocks: KnownBlock[] = [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: text,
        },
      }
    ];

    if (imageUrl) {
      blocks.push({
        type: "image",
        image_url: imageUrl,
        alt_text: "添付画像"
      } as ImageBlock);
    }

    return blocks;
  }

  // 回答モーダル送信ハンドラー
  slackBot.view(
    "reply_modal",
    async ({ ack, body, view, client }: SlackViewMiddlewareArgs<ViewSubmitAction> & { client: WebClient }) => {
      try {
        await ack();
        const reply = view.state.values.reply_input.input.value;
        const userId = body.user.id;

        // 画像URLを取得
        const imageBlock = view.state.values.reply_image_block?.reply_image;
        const files = imageBlock?.files;
        const imageUrl = files?.[0]?.permalink;

        const metadata = JSON.parse(view.private_metadata);
        const channelId = metadata.channelId;
        const messageTs = metadata.messageTs;

        const blocks = buildMessageBlocks(
          `<@${userId}> さんの回答:\n${reply}`,
          imageUrl
        );

        // 画像がある場合は追加
        if (imageUrl) {
          blocks.push({
            type: "image",
            image_url: imageUrl,
            alt_text: "回答の画像"
          } as ImageBlock);
        }

        await client.chat.postMessage({
          channel: channelId,
          thread_ts: messageTs,
          text: `<@${userId}> さんの回答:\n${reply}`,
          blocks: blocks,
        });
      } catch (error) {
        console.error(error);
      }
    }
  );
}
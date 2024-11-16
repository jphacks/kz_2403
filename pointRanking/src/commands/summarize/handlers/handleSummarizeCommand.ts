import { SlackCommandMiddlewareArgs } from "@slack/bolt";
import { WebClient } from "@slack/web-api";

export async function handleSummarizeCommand({
  command,
  ack,
  client,
}: SlackCommandMiddlewareArgs & { client: WebClient }) {
  await ack();

  try {
    await client.views.open({
      trigger_id: command.trigger_id,
      view: {
        type: "modal",
        callback_id: "summarize_modal",
        private_metadata: command.channel_id,
        title: {
          type: "plain_text",
          text: "Notionページの要約",
        },
        blocks: [
          {
            type: "input",
            block_id: "page_url_block",
            element: {
              type: "plain_text_input",
              action_id: "page_url",
              placeholder: {
                type: "plain_text",
                text: "NotionページのURLを入力してください",
              },
            },
            label: {
              type: "plain_text",
              text: "NotionページのURL",
            },
          },
        ],
        submit: {
          type: "plain_text",
          text: "要約する",
        },
      },
    });
  } catch (error) {
    console.error("モーダル表示エラー:", error);
  }
}
import { ViewSubmitAction, SlackViewMiddlewareArgs } from "@slack/bolt";
import { WebClient } from "@slack/web-api";
import { channelMap } from "../utils/channelMap";

export const handleDecorateModalSubmission = async ({
  ack,
  body,
  view,
  client,
}: SlackViewMiddlewareArgs<ViewSubmitAction> & { client: WebClient }) => {
  await ack();
  const text = view.state.values.text_input.input.value;
  if (!text) {
    throw new Error("テキストが入力されていません");
  }
  const style = view.state.values.style_selection.style.selected_option?.value;
  const channelId = channelMap.get(body.user.id);
  if (!channelId) {
    console.error("チャンネルIDが見つかりません");
    return;
  }
  try {
    if (style === "sudden_death") {
      const lengthFactor = Math.max(5, Math.ceil(text.length / 2));
      const peopleString = "人".repeat(lengthFactor);
      const yString = "Y^".repeat(lengthFactor);
      await client.chat.postMessage({
        channel: channelId,
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: `＿${peopleString}＿`,
            },
          },
          {
            type: "header",
            text: {
              type: "plain_text",
              text: `＞　${text}　＜`,
            },
          },
          {
            type: "header",
            text: {
              type: "plain_text",
              text: `￣${yString}￣`,
            },
          },
        ],
      });
    } else {
      await client.chat.postMessage({
        channel: channelId,
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: `✨ ${text} ✨`,
            },
          },
        ],
      });
    }
    channelMap.delete(body.user.id);
  } catch (error) {
    console.error("投稿エラー:", error);
    throw error;
  }
};

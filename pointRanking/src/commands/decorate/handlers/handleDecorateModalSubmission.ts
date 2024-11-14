import { ViewSubmitAction, SlackViewMiddlewareArgs } from "@slack/bolt";
import { WebClient } from "@slack/web-api";
import { channelMap } from "../utils/channelMap";
import { Block, KnownBlock } from "@slack/types";

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
    let blocks: (Block | KnownBlock)[];
    if (style === "sudden_death") {
      // 既存の突然の死スタイル
      const lengthFactor = Math.max(5, Math.ceil(text.length / 2));
      const peopleString = "人".repeat(lengthFactor);
      const yString = "Y^".repeat(lengthFactor);
      blocks = [
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
      ];
    } else if (style === "simple_decor") {
      // シンプル装飾
      blocks = [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `✨ ${text} ✨`,
          },
        },
      ];
    } else if (style === "star_border") {
      // 新しい星囲みスタイル
      blocks = [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `🌟 ${text} 🌟`,
          },
        },
      ];
    } else if (style === "speech_bubble") {
      // 新しい吹き出しスタイル
      blocks = [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `💬「${text}」`,
          },
        },
      ];
    } else {
      // デフォルトの装飾なし
      blocks = [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: text,
          },
        },
      ];
    }

    await client.chat.postMessage({
      channel: channelId,
      blocks: blocks,
    });
    channelMap.delete(body.user.id);
  } catch (error) {
    console.error("投稿エラー:", error);
    throw error;
  }
};
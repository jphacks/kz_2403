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
  const userId = body.user.id;  // ユーザーIDを取得

  if (!channelId) {
    console.error("チャンネルIDが見つかりません");
    return;
  }

  try {
    let blocks: (Block | KnownBlock)[];
    if (style === "sudden_death") {
      const lengthFactor = Math.max(5, Math.ceil(text.length / 2));
      const peopleString = "人".repeat(lengthFactor);
      const yString = "Y^".repeat(lengthFactor);
      blocks = [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `<@${userId}>`,
          }
        },
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
      blocks = [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `<@${userId}>`,
          }
        },
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `✨ ${text} ✨`,
          },
        },
      ];
    } else if (style === "star_border") {
      blocks = [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `<@${userId}>`,
          }
        },
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `🌟 ${text} 🌟`,
          },
        },
      ];
    } else if (style === "speech_bubble") {
      blocks = [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `<@${userId}>`,
          }
        },
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `💬「${text}」`,
          },
        },
      ];
    } else {
      blocks = [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `<@${userId}>`,
          }
        },
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
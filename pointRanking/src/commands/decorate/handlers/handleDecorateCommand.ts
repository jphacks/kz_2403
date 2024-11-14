import { ExtendedSlackCommandMiddlewareArgs } from "../types";
import { channelMap } from "../utils/channelMap";

export const handleDecorateCommand = async ({
  command,
  ack,
  client,
}: ExtendedSlackCommandMiddlewareArgs) => {
  try {
    await ack();
    channelMap.set(command.user_id, command.channel_id);

    await client.views.open({
      trigger_id: command.trigger_id,
      view: {
        type: "modal",
        callback_id: "decorate_modal",
        title: {
          type: "plain_text",
          text: "テキスト装飾",
        },
        blocks: [
          {
            type: "input",
            block_id: "text_input",
            element: {
              type: "plain_text_input",
              action_id: "input",
              placeholder: {
                type: "plain_text",
                text: "テキストを入力してください",
              },
            },
            label: {
              type: "plain_text",
              text: "装飾するテキスト",
            },
          },
          {
            type: "section",
            block_id: "style_selection",
            text: {
              type: "mrkdwn",
              text: "装飾スタイルを選択してください：",
            },
            accessory: {
              type: "static_select",
              action_id: "style",
              placeholder: {
                type: "plain_text",
                text: "スタイルを選択",
              },
              options: [
                {
                  text: {
                    type: "plain_text",
                    text: "🔥 突然の死 🔥",
                  },
                  value: "sudden_death",
                },
                {
                  text: {
                    type: "plain_text",
                    text: "✨ シンプル装飾 ✨",
                  },
                  value: "simple_decor",
                },
              ],
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
    console.error("モーダル表示エラー:", error);
  }
};

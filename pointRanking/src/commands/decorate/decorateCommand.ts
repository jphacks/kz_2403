import { SlackCommandMiddlewareArgs, ViewSubmitAction, SlackViewMiddlewareArgs } from "@slack/bolt";
import { WebClient } from "@slack/web-api";

interface ExtendedSlackCommandMiddlewareArgs extends SlackCommandMiddlewareArgs {
  client: WebClient;
}

const channelMap = new Map<string, string>();

export default function decorateCommand(slackBot: any) {
  slackBot.command("/decorate", async ({ command, ack, client }: ExtendedSlackCommandMiddlewareArgs) => {
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
            text: "テキスト装飾"
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
                  text: "テキストを入力してください"
                }
              },
              label: {
                type: "plain_text",
                text: "装飾するテキスト"
              }
            },
            {
              type: "section",
              block_id: "style_selection",
              text: {
                type: "mrkdwn",
                text: "装飾スタイルを選択してください："
              },
              accessory: {
                type: "static_select",
                action_id: "style",
                placeholder: {
                  type: "plain_text",
                  text: "スタイルを選択"
                },
                options: [
                  {
                    text: {
                      type: "plain_text",
                      text: "🔥 突然の死 🔥"
                    },
                    value: "sudden_death"
                  },
                  {
                    text: {
                      type: "plain_text",
                      text: "✨ シンプル装飾 ✨"
                    },
                    value: "simple_decor"
                  }
                ]
              }
            }
          ],
          submit: {
            type: "plain_text",
            text: "送信"
          }
        }
      });
    } catch (error) {
      console.error("モーダル表示エラー:", error);
    }
  });

  slackBot.view("decorate_modal", async ({ ack, body, view, client }: SlackViewMiddlewareArgs<ViewSubmitAction> & { client: any }) => {
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
                text: `＿${peopleString}＿`
              }
            },
            {
              type: "header",
              text: {
                type: "plain_text",
                text: `＞　${text}　＜`
              }
            },
            {
              type: "header",
              text: {
                type: "plain_text",
                text: `￣${yString}￣`
              }
            }
          ]
        });
      } else {
        await client.chat.postMessage({
          channel: channelId,
          blocks: [
            {
              type: "header",
              text: {
                type: "plain_text",
                text: `✨ ${text} ✨`
              }
            }
          ]
        });
      }

      channelMap.delete(body.user.id);
    } catch (error) {
      console.error("投稿エラー:", error);
      throw error;
    }
  });
}
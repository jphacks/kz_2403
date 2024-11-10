import { SlackCommandMiddlewareArgs, ViewSubmitAction, SlackViewMiddlewareArgs } from "@slack/bolt";
import monthRankingCommand from "./monthRankingCommand";
import totalPointsCommand from "./totalPointsCommand";
import myPointsCommand from "./myPointsCommand";

const channelMap = new Map<string, string>();

export default function rankingCommand(slackBot: any, supabase: any) {
  // 各コマンドのハンドラーをインポート
  const { handleMonthRanking } = monthRankingCommand(slackBot, supabase);
  const { handleTotalPoints } = totalPointsCommand(slackBot, supabase);
  const { handleMyPoints } = myPointsCommand(slackBot, supabase);

  slackBot.command("/ranking", async ({ command, ack, client }: SlackCommandMiddlewareArgs & { client: any }) => {
    try {
      await ack();
      
      channelMap.set(command.user_id, command.channel_id);

      await client.views.open({
        trigger_id: command.trigger_id,
        view: {
          type: "modal",
          callback_id: "ranking_modal",
          title: {
            type: "plain_text",
            text: "ランキング"
          },
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: "表示したいランキングを選択してください："
              },
              accessory: {
                type: "static_select",
                action_id: "ranking_type",
                placeholder: {
                  type: "plain_text",
                  text: "ランキングタイプを選択"
                },
                options: [
                  {
                    text: {
                      type: "plain_text",
                      text: "🏆 月間ランキング"
                    },
                    value: "monthly"
                  },
                  {
                    text: {
                      type: "plain_text",
                      text: "🌟 累計ポイントランキング"
                    },
                    value: "total"
                  },
                  {
                    text: {
                      type: "plain_text",
                      text: "👤 マイポイント"
                    },
                    value: "my"
                  }
                ]
              }
            }
          ],
          submit: {
            type: "plain_text",
            text: "表示"
          }
        }
      });
    } catch (error) {
      console.error("モーダル表示エラー:", error);
    }
  });

  slackBot.view("ranking_modal", async ({ ack, body, view, client }: SlackViewMiddlewareArgs<ViewSubmitAction> & { client: any }) => {
    await ack();

    const selectedValue = view.state.values.ranking_type.ranking_type.selected_option?.value;
    const channelId = channelMap.get(body.user.id);
    const workspaceId = body.team?.id;

    if (!channelId) {
      console.error("チャンネルIDが見つかりません");
      return;
    }

    if (!workspaceId) {
      console.error("ワークスペースIDが見つかりません");
      return;
    }

    try {
      switch (selectedValue) {
        case "monthly":
          await handleMonthRanking(channelId, workspaceId);
          break;
        case "total":
          await handleTotalPoints(channelId, workspaceId);
          break;
        case "my":
          await handleMyPoints(channelId, body.user.id, workspaceId);
          break;
      }
      
      channelMap.delete(body.user.id);
    } catch (error) {
      console.error("ランキング取得エラー:", error);
      await client.chat.postMessage({
        channel: channelId,
        text: "ランキングの取得に失敗しました"
      });
    }
  });
}
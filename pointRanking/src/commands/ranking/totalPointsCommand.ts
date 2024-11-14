import { SlackCommandMiddlewareArgs } from "@slack/bolt";
import { WebClient } from "@slack/web-api";

export default function totalPointsCommand(slackBot: any, supabase: any) {
  slackBot.command(
    "/totalpoints",
    async ({ command, ack, client }: SlackCommandMiddlewareArgs & { client: any }) => {
      try {
        await ack();
        handleTotalPoints(client, command.response_url, command.team_id);
      } catch (error) {
        console.error("ackのエラー:", error);
      }
    }
  );

  const handleTotalPoints = async (client: WebClient, channelId: string, workspaceId: string) => {
    try {
      const { data: pointsData, error: pointsError } = await supabase
        .from("UserNew")
        .select("user_id, workspace_id, user_name, total_point")
        .eq("workspace_id", workspaceId)
        .order("total_point", { ascending: false })
        .limit(10);

      if (pointsError) {
        throw new Error("UserNewテーブルの取得に失敗しました");
      }

      const pointsBlocks = pointsData.map((entry: any, index: number) => {
        const medal =
          index === 0
            ? "🥇"
            : index === 1
            ? "🥈"
            : index === 2
            ? "🥉"
            : "";
        return {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `${medal} *${index + 1}位* - *${entry.user_name}*`,
          },
          fields: [
            {
              type: "mrkdwn",
              text: `*スコア:* ${entry.total_point}pts`,
            },
          ],
        };
      });

      const blocks = [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*:trophy: 累計ポイントランキング :trophy:*\nこちらが累計ポイントのトップランキングです！",
          },
        },
        {
          type: "divider",
        },
        ...pointsBlocks,
        {
          type: "divider",
        },
      ];

      await client.chat.postMessage({
        channel: channelId,
        blocks: blocks,
        text: "累計ポイントランキング",
      });
    } catch (error) {
      console.error("累計ポイント取得エラー:", error);
    }
  };

  return { handleTotalPoints };
}

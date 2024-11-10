import { SlackCommandMiddlewareArgs } from "@slack/bolt";
import axios from "axios";

export default function totalPointsCommand(slackBot: any, supabase: any) {
  slackBot.command("/totalpoints", async ({ command, ack }: SlackCommandMiddlewareArgs) => {
    try {
      await ack();
      handleTotalPoints(command.response_url).catch(console.error);
    } catch (error) {
      console.error("ackのエラー:", error);
    }
  });

  const handleTotalPoints = async (channelId: string) => {
    try {
      const { data: pointsData, error: pointsError } = await supabase
        .from("User")
        .select("user_id, user_name, total_point")
        .order("total_point", { ascending: false })
        .limit(10);

      if (pointsError) {
        throw new Error("Userテーブルの取得に失敗しました");
      }

      const pointsBlocks = pointsData.map((entry: any, index: number) => {
        const medal =
          index === 0
            ? ":金メダル:"
            : index === 1
            ? ":銀メダル:"
            : index === 2
            ? ":銅メダル:"
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
            text: "*:トロフィー: 累計ポイントランキング :トロフィー:*\nこちらが累計ポイントのトップランキングです！",
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

      await axios.post(channelId, {
        blocks,
        response_type: "in_channel",
      });
    } catch (error) {
      console.error("累計ポイント取得エラー:", error);
      await axios.post(channelId, {
        text: "データの取得に失敗しました",
        response_type: "in_channel",
      });
    }
  };

  return { handleTotalPoints };
}
import { SlackCommandMiddlewareArgs } from "@slack/bolt";
import axios from "axios";

export default function monthRankingCommand(slackBot: any, supabase: any) {
  slackBot.command(
    "/monthranking",
    async ({ command, ack }: SlackCommandMiddlewareArgs) => {
      try {
        await ack();
        const workspaceId = command.team_id;
        handleMonthRanking(command.response_url, workspaceId).catch(
          console.error
        );
      } catch (error) {
        console.error("ackのエラー:", error);
      }
    }
  );

  const handleMonthRanking = async (channelId: string, workspaceId: string) => {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7) + "-01";

      const { data: rankingData, error: rankingError } = await supabase
        .from("MonthLogNew")
        .select("user_id, workspace_id, month_add_point")
        .eq("result_month", currentMonth)
        .eq("workspace_id", workspaceId)
        .order("month_add_point", { ascending: false })
        .limit(10);

      if (rankingError) {
        throw new Error("MonthLogテーブルの取得に失敗しました");
      }

      const userIds = rankingData.map((entry: any) => entry.user_id);
      const { data: usersData, error: usersError } = await supabase
        .from("UserNew")
        .select("user_id, workspace_id, user_name")
        .in("user_id", userIds)
        .eq("work_space_id", workspaceId);

      if (usersError) {
        throw new Error("UserNewテーブルの取得に失敗しました");
      }

      const userIdToName: { [key: string]: string } = usersData.reduce(
        (
          acc: { [key: string]: string },
          user: { user_id: string; user_name: string }
        ) => {
          acc[user.user_id] = user.user_name;
          return acc;
        },
        {}
      );

      const rankingBlocks = rankingData.map((entry: any, index: number) => {
        const userName = userIdToName[entry.user_id] || "unknown";
        const medal =
          index === 0
            ? ":first_place_medal:"
            : index === 1
            ? ":second_place_medal:"
            : index === 2
            ? ":third_place_medal:"
            : "";
        return {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `${medal} *${index + 1}位* - *${userName}*`,
          },
          fields: [
            {
              type: "mrkdwn",
              text: `*スコア:* ${entry.month_total_point}pts`,
            },
          ],
        };
      });

      const blocks = [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*:trophy: 最新ランキング :trophy:*\nこちらが最新のトップランキングです！",
          },
        },
        {
          type: "divider",
        },
        ...rankingBlocks,
        {
          type: "divider",
        },
      ];

      await axios.post(channelId, {
        blocks,
        response_type: "in_channel",
      });
    } catch (error) {
      console.error("ポイントランキング取得エラー:", error);
      await axios.post(channelId, {
        text: "データの取得に失敗しました",
        response_type: "in_channel",
      });
    }
  };
  return { handleMonthRanking };
}

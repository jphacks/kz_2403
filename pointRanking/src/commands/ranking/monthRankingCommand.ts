import { SlackCommandMiddlewareArgs } from "@slack/bolt";
import { WebClient } from "@slack/web-api";

export default function monthRankingCommand(slackBot: any, supabase: any) {
  slackBot.command(
    "/monthranking",
    async ({ command, ack, client }: SlackCommandMiddlewareArgs & { client: any }) => {
      try {
        await ack();
        const workspaceId = command.team_id;
        await handleMonthRanking(client, command.channel_id, workspaceId);
      } catch (error) {
        console.error("ackのエラー:", error);
      }
    }
  );

  const handleMonthRanking = async (
    client: WebClient,
    channelId: string,
    workspaceId: string
  ) => {
    try {
      const today = new Date();
      const yearMonth = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;

      const { data: rankingData, error: rankingError } = await supabase
        .from("MonthLogNew")
        .select("user_id, workspace_id, year_month, month_add_point")
        .eq("year_month", yearMonth)
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
        .eq("workspace_id", workspaceId);

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
              text: `*スコア:* ${entry.month_add_point}pts`,
            },
          ],
        };
      });

      const blocks = [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*:trophy: 最新ランキング :trophy:*\nこちらが今月のトップランキングです！",
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

      await client.chat.postMessage({
        channel: channelId,
        blocks: blocks,
        text: "月間ポイントランキング",
      });
    } catch (error) {
      console.error("ポイントランキング取得エラー:", error);
      await client.chat.postMessage({
        channel: channelId,
        text: "データの取得に失敗しました",
      });
    }
  };
  return { handleMonthRanking };
}
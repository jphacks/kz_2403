import { SlackCommandMiddlewareArgs } from "@slack/bolt";
import axios from "axios";

export default function monthRankingCommand(slackBot: any, supabase: any) {
  slackBot.command("/monthranking", async ({ command, ack }: SlackCommandMiddlewareArgs) => {
    try {
      await ack();
      handleMonthRanking(command, supabase).catch(console.error);
    } catch (error) {
      console.error("ackのエラー:", error);
    }
  });
}

async function handleMonthRanking(command: SlackCommandMiddlewareArgs["command"], supabase: any) {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7) + "-01";

    const { data: rankingData, error: rankingError } = await supabase
      .from("MonthLog")
      .select("user_id, month_total_point")
      .eq("result_month", currentMonth)
      .order("month_total_point", { ascending: false })
      .limit(10);

    if (rankingError) {
      console.error("MonthLogテーブルの取得エラー:", rankingError);
      await axios.post(command.response_url, {
        text: "データの取得に失敗しました",
        response_type: "in_channel",
      });
      return;
    }

    const userIds = rankingData.map((entry: any) => entry.user_id);
    const { data: usersData, error: usersError } = await supabase
      .from("User")
      .select("user_id, user_name")
      .in("user_id", userIds);

    if (usersError) {
      console.error("Userテーブルの取得エラー:", usersError);
      await axios.post(command.response_url, {
        text: "データの取得に失敗しました",
        response_type: "in_channel",
      });
      return;
    }

    const userIdToName: { [key: string]: string } = usersData.reduce(
      (acc: { [key: string]: string }, user: { user_id: string; user_name: string }) => {
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

    await axios.post(command.response_url, {
      blocks,
      response_type: "in_channel",
    });
  } catch (error) {
    console.error("ポイントランキング取得エラー:", error);
    await axios.post(command.response_url, {
      text: "データの取得に失敗しました",
      response_type: "in_channel",
    });
  }
}
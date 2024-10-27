import { SlackCommandMiddlewareArgs } from "@slack/bolt";
import { useSlackbot } from "./hooks/useSlackbot";
import { useSupabase } from "./hooks/useSupabase";
import axios from 'axios';

const { slackBot, PORT } = useSlackbot();
const { supabase } = useSupabase();

// ackの応答速度を最大化するために、非同期処理の後に行う
// 月間ランキングのスラッシュコマンド
slackBot.command("/monthranking", async ({ command, ack }) => {
  try {
    await ack();  // 即座にACKを返すことで応答速度を最大化
    handleMonthRanking(command).catch(console.error); 
  } catch (error) {
    console.error("ackのエラー:", error);
  }
  handleMonthRanking(command).catch(console.error);  // 非同期処理をバックグラウンドで行う
});

async function handleMonthRanking(command: SlackCommandMiddlewareArgs["command"]) {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM形式

    // SupabaseのMonthLogテーブルからポイントランキングを取得
    const rankingPromise = supabase
      .from("MonthLog")
      .select("user_id, month_total_point")
      .eq("result_month", currentMonth)
      .order("month_total_point", { ascending: false })
      .limit(10);

    const { data: rankingData, error: rankingError } = await rankingPromise;

    if (rankingError) {
      console.error("MonthLogテーブルの取得エラー:", rankingError);
      await axios.post(command.response_url, {
        text: "データの取得に失敗しました",
        response_type: "ephemeral",
      });
      return;
    }

    // ユーザー名を取得するためにUserテーブルを参照
    const userIds = rankingData.map((entry) => entry.user_id);
    const usersPromise = supabase
      .from("User")
      .select("user_id, user_name")
      .in("user_id", userIds);

    const { data: usersData, error: usersError } = await usersPromise;

    if (usersError) {
      console.error("Userテーブルの取得エラー:", usersError);
      await axios.post(command.response_url, {
        text: "データの取得に失敗しました",
        response_type: "ephemeral",
      });
      return;
    }

    // ユーザーIDとユーザー名のマッピングを作成
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

    // ランキングデータを整形
    const rankingText = rankingData
      .map((entry, index) => {
        const userName = userIdToName[entry.user_id] || "unknown";
        return `${index + 1}位: ${userName} : ${entry.month_total_point}pt`;
      })
      .join("\n");

    // ランキングをSlackに投稿
    await axios.post(command.response_url, {
      text: `今月のポイントランキング\n${rankingText}`,
      response_type: "in_channel",
    });
  } catch (error) {
    console.error("ポイントランキング取得エラー:", error);
    await axios.post(command.response_url, {
      text: "データの取得に失敗しました",
      response_type: "ephemeral",
    });
  }
}

// アプリの起動
(async () => {
  await slackBot.start(PORT || 3000);
  console.log(`${PORT}を立ち上げました`);
})();
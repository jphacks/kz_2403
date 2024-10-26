import { App } from '@slack/bolt';
import { useSupabase } from "./hooks/useSupabase";
import dotenv from 'dotenv';

dotenv.config();

const { supabase } = useSupabase();

const slackBot = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

// 月間ランキングのスラッシュコマンド
slackBot.command("/monthRanking", async ({ command, ack, client }) => {
  try {
    // コマンドの受信
    await ack();
    console.log("monthRankingコマンドが実行されました");

    // 現在の月を取得
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM形式
    console.log("現在の月:", currentMonth);

    // SupabaseのMonthLogテーブルからポイントランキングを取得
    const { data: rankingData, error } = await supabase
      .from("MonthLog")
      .select("user_id, month_total_point")
      .eq("result_month", currentMonth)
      .order("month_total_point", { ascending: false })
      .limit(10);

    if (error) {
      console.error("MonthLogテーブルの取得エラー:", error);
      await client.chat.postMessage({
        channel: command.channel_id,
        text: "データの取得に失敗しました",
      });
      return;
    }

    // ユーザー名を取得するためにUserテーブルを参照
    const userIds = rankingData.map((entry) => entry.user_id);
    const { data: usersData, error: usersError } = await supabase
      .from("User")
      .select("user_id, user_name")
      .in("user_id", userIds);

    if (usersError) {
      console.error("Userテーブルの取得エラー:", usersError);
      await client.chat.postMessage({
        channel: command.channel_id,
        text: "データの取得に失敗しました",
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
    await client.chat.postMessage({
      channel: command.channel_id,
      text: `今月のポイントランキング\n${rankingText}`,
    });
  } catch (error) {
    console.error("ポイントランキング取得エラー:", error);
    await client.chat.postMessage({
      channel: command.channel_id,
      text: "データの取得に失敗しました",
    });
  }
});

// 総合ランキングのスラッシュコマンド
slackBot.command("/totalRanking", async ({ command, ack, client }) => {
  try {
    // コマンドの受信
    await ack();
    console.log("totalRankingコマンドが実行されました");

    // SupabaseのUserテーブルからポイントランキングを取得
    const { data: rankingData, error } = await supabase
      .from("User")
      .select("user_id, user_name, total_point")
      .order("total_point", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Userテーブルの取得エラー:", error);
      await client.chat.postMessage({
        channel: command.channel_id,
        text: "データの取得に失敗しました",
      });
      return;
    }

    // ランキングデータを整形
    const rankingText = rankingData
      .map((entry, index) => {
        return `${index + 1}位: ${entry.user_name} : ${entry.total_point}pt`;
      })
      .join("\n");

    // ランキングをSlackに投稿
    await client.chat.postMessage({
      channel: command.channel_id,
      text: `総合ポイントランキング\n${rankingText}`,
    });
  } catch (error) {
    console.error("ポイントランキング取得エラー:", error);
    await client.chat.postMessage({
      channel: command.channel_id,
      text: "データの取得に失敗しました",
    });
  }
});

// 自分の順位を表示するスラッシュコマンド
slackBot.command("/myRanking", async ({ command, ack, client }) => {
  try {
    // コマンドの受信
    await ack();
    console.log("myRankingコマンドが実行されました");

    const userId = command.user_id;

    // SupabaseのUserテーブルから全ユーザーのポイントを取得
    const { data: rankingData, error } = await supabase
      .from("User")
      .select("user_id, user_name, total_point")
      .order("total_point", { ascending: false });

    if (error) {
      console.error("Userテーブルの取得エラー:", error);
      await client.chat.postEphemeral({
        channel: command.channel_id,
        user: userId,
        text: "データの取得に失敗しました",
      });
      return;
    }

    // 自分の順位を計算
    const userRanking =
      rankingData.findIndex((entry) => entry.user_id === userId) + 1;
    const userPoints =
      rankingData.find((entry) => entry.user_id === userId)?.total_point || 0;

    // 自分の順位をSlackに投稿
    await client.chat.postEphemeral({
      channel: command.channel_id,
      user: userId,
      text: `あなたの現在の順位は ${userRanking}位 です。ポイント: ${userPoints}pt`,
    });
  } catch (error) {
    console.error("ポイントランキング取得エラー:", error);
    await client.chat.postEphemeral({
      channel: command.channel_id,
      user: command.user_id,
      text: "データの取得に失敗しました",
    });
  }
});

// アプリの起動
(async () => {
  const PORT = process.env.PORT || 3000;
  await slackBot.start(PORT);
  console.log(`${PORT}を立ち上げました`);
})();
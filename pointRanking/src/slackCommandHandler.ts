import { useSlackbot } from "./hooks/useSlackbot";
import { useSupabase } from "./hooks/useSupabase";
import axios from 'axios';

const { slackBot, PORT } = useSlackbot();
const { supabase } = useSupabase();

// 月間ランキングのスラッシュコマンド
slackBot.command("/monthranking", async ({ command, ack }) => {
  // コマンドの受信ACKを即座に返す
  await ack();
  console.log("monthRankingコマンドが実行されました");

  // 非同期処理でデータを取得してSlackに送信
  (async () => {
    try {
      // 現在の月を取得
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM形式

      // SupabaseのMonthLogテーブルからポイントランキングを取得
      const { data: rankingData, error } = await supabase
        .from("MonthLog")
        .select("user_id, month_total_point")
        .eq("result_month", currentMonth)
        .order("month_total_point", { ascending: false })
        .limit(10);

      if (error) {
        console.error("MonthLogテーブルの取得エラー:", error);
        await axios.post(command.response_url, {
          text: "データの取得に失敗しました",
          response_type: "ephemeral",
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
  })(); // 即時実行
});

// 総合ランキングのスラッシュコマンド
slackBot.command("/totalranking", async ({ command, ack }) => {
  // コマンドの受信ACKを即座に返す
  await ack();
  console.log("totalRankingコマンドが実行されました");

  // 非同期処理でデータを取得してSlackに送信
  (async () => {
    try {
      const { data: rankingData, error } = await supabase
        .from("User")
        .select("user_id, user_name, total_point")
        .order("total_point", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Userテーブルの取得エラー:", error);
        await axios.post(command.response_url, {
          text: "データの取得に失敗しました",
          response_type: "ephemeral",
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
      await axios.post(command.response_url, {
        text: `総合ポイントランキング\n${rankingText}`,
        response_type: "in_channel",
      });
    } catch (error) {
      console.error("ポイントランキング取得エラー:", error);
      await axios.post(command.response_url, {
        text: "データの取得に失敗しました",
        response_type: "ephemeral",
      });
    }
  })(); // 即時実行
});

// 自分の順位を表示するスラッシュコマンド
slackBot.command("/myranking", async ({ command, ack }) => {
  // コマンドの受信ACKを即座に返す
  await ack();
  console.log("myRankingコマンドが実行されました");

  const userId = command.user_id;

  // 非同期処理でデータを取得してSlackに送信
  (async () => {
    try {
      const { data: rankingData, error } = await supabase
        .from("User")
        .select("user_id, user_name, total_point")
        .order("total_point", { ascending: false });

      if (error) {
        console.error("Userテーブルの取得エラー:", error);
        await axios.post(command.response_url, {
          text: "データの取得に失敗しました",
          response_type: "ephemeral",
        });
        return;
      }

      // 自分の順位を計算
      const userRanking =
        rankingData.findIndex((entry) => entry.user_id === userId) + 1;
      const userPoints =
        rankingData.find((entry) => entry.user_id === userId)?.total_point || 0;

      // 自分の順位をSlackに投稿
      await axios.post(command.response_url, {
        text: `あなたの現在の順位は ${userRanking}位 です。ポイント: ${userPoints}pt`,
        response_type: "ephemeral",
      });
    } catch (error) {
      console.error("ポイントランキング取得エラー:", error);
      await axios.post(command.response_url, {
        text: "データの取得に失敗しました",
        response_type: "ephemeral",
      });
    }
  })(); // 即時実行
});

// アプリの起動
(async () => {
  await slackBot.start(PORT || 3000);
  console.log(`${PORT}を立ち上げました`);
})();
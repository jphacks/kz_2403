import { SlackCommandMiddlewareArgs } from "@slack/bolt";
import { useSlackbot } from "./hooks/useSlackbot";
import { useSupabase } from "./hooks/useSupabase";
import axios from 'axios';

const { slackBot, PORT } = useSlackbot();
const { supabase } = useSupabase();

// ackのテスト
slackBot.command("/test", async ({ ack }) => {
  try {
    await ack();
  } catch (error) {
    console.error("ackのエラー:", error);
  }
});

// 月間ランキングのスラッシュコマンド
slackBot.command("/monthranking", async ({ command, ack }) => {
  try {
    await ack();  // 即座にACKを返すことで応答速度を最大化
    handleMonthRanking(command).catch(console.error); 
  } catch (error) {
    console.error("ackのエラー:", error);
  }
});

async function handleMonthRanking(command: SlackCommandMiddlewareArgs["command"]) {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7) + "-01"; // YYYY-MM形式

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
        response_type: "in_channel",  // 全体に見えるように設定
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
        response_type: "in_channel",  // 全体に見えるように設定
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
      response_type: "in_channel",  // 全体に見えるように設定
    });
  } catch (error) {
    console.error("ポイントランキング取得エラー:", error);
    await axios.post(command.response_url, {
      text: "データの取得に失敗しました",
      response_type: "in_channel",  // 全体に見えるように設定
    });
  }
}

// 累計ポイントのスラッシュコマンド
slackBot.command("/totalpoints", async ({ command, ack }) => {
  try {
    await ack();  // 即座にACKを返すことで応答速度を最大化
    handleTotalPoints(command).catch(console.error); 
  } catch (error) {
    console.error("ackのエラー:", error);
  }
});

async function handleTotalPoints(command: SlackCommandMiddlewareArgs["command"]) {
  try {
    // SupabaseのUserテーブルから累計ポイントを取得
    const pointsPromise = supabase
      .from("User")
      .select("user_id, user_name, total_point")
      .order("total_point", { ascending: false })
      .limit(10);

    const { data: pointsData, error: pointsError } = await pointsPromise;

    if (pointsError) {
      console.error("Userテーブルの取得エラー:", pointsError);
      await axios.post(command.response_url, {
        text: "データの取得に失敗しました",
        response_type: "in_channel",  // 全体に見えるように設定
      });
      return;
    }

    // ポイントデータを整形
    const pointsText = pointsData
      .map((entry, index) => {
        return `${index + 1}位: ${entry.user_name} : ${entry.total_point}pt`;
      })
      .join("\n");

    // 累計ポイントをSlackに投稿
    await axios.post(command.response_url, {
      text: `累計ポイントランキング\n${pointsText}`,
      response_type: "in_channel",  // 全体に見えるように設定
    });
  } catch (error) {
    console.error("累計ポイント取得エラー:", error);
    await axios.post(command.response_url, {
      text: "データの取得に失敗しました",
      response_type: "in_channel",  // 全体に見えるように設定
    });
  }
}

// ユーザー個人のポイントを確認するスラッシュコマンド
slackBot.command("/mypoints", async ({ command, ack }) => {
  try {
    await ack();  // 即座にACKを返すことで応答速度を最大化
    handleMyPoints(command).catch(console.error); 
  } catch (error) {
    console.error("ackのエラー:", error);
  }
});

async function handleMyPoints(command: SlackCommandMiddlewareArgs["command"]) {
  try {
    const userId = command.user_id;

    // SupabaseのUserテーブルから全ユーザーのポイントを取得
    const { data: allUsersData, error: allUsersError } = await supabase
      .from("User")
      .select("user_id, user_name, total_point")
      .order("total_point", { ascending: false });

    if (allUsersError) {
      console.error("Userテーブルの取得エラー:", allUsersError);
      await axios.post(command.response_url, {
        text: "データの取得に失敗しました",
        response_type: "ephemeral",  // 自分だけ見えるように設定
      });
      return;
    }

    // ユーザーのポイントデータを取得
    const userData = allUsersData.find(user => user.user_id === userId);

    if (!userData) {
      console.error("ユーザーが見つかりません");
      await axios.post(command.response_url, {
        text: "ユーザーが見つかりません",
        response_type: "ephemeral",  // 自分だけ見えるように設定
      });
      return;
    }

    // ユーザーの順位を計算
    const userRank = allUsersData.findIndex(user => user.user_id === userId) + 1;

    // ユーザーのポイントデータを整形
    const pointsText = `あなたのポイント\n${userData.user_name} : ${userData.total_point}pt\n順位: ${userRank}位`;

    // ユーザーのポイントをSlackに投稿
    await axios.post(command.response_url, {
      text: pointsText,
      response_type: "ephemeral",  // 自分だけ見えるように設定
    });
  } catch (error) {
    console.error("ユーザーポイント取得エラー:", error);
    await axios.post(command.response_url, {
      text: "データの取得に失敗しました",
      response_type: "ephemeral",  // 自分だけ見えるように設定
    });
  }
}

// アプリの起動
(async () => {
  await slackBot.start(PORT || 3000);
  console.log(`${PORT}を立ち上げました`);
})();
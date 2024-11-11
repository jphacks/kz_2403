import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const slackWebhookUrl = Deno.env.get("SLACK_WEBHOOK_URL") || "";

// Supabaseのクライアントを作成
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

if (!supabaseUrl || !supabaseServiceRoleKey || !slackWebhookUrl) {
  console.error("環境変数が正しく設定されていません!!");
}

serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("OK", {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
        },
      });
    }

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM形式

    // SupabaseのMonthLogテーブルからポイントランキングを取得
    const { data: rankingData, error } = await supabase
      .from("MonthLogNew")
      .select("user_id, month_add_point")
      .eq("result_month", `${currentMonth}-01`) // 正しい日付形式に修正
      .order("month_add_point", { ascending: false })
      .limit(10);

    if (error) {
      console.error("MonthLogテーブルの取得エラー:", error);
      await fetch(slackWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: "データの取得に失敗しました",
        }),
      });
      return new Response("データの取得に失敗しました", { status: 500 });
    }

    // ユーザー名を取得するためにUserテーブルを参照
    const userIds = rankingData.map((entry) => entry.user_id);
    const { data: usersData, error: usersError } = await supabase
      .from("UserNew")
      .select("user_id, user_name")
      .in("user_id", userIds);

    if (usersError) {
      console.error("Userテーブルの取得エラー:", usersError);
      await fetch(slackWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: "データの取得に失敗しました",
        }),
      });
      return new Response("データの取得に失敗しました", { status: 500 });
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
        return `${index + 1}位: ${userName} : ${entry.month_add_point}pt`;
      })
      .join("\n");

    // ランキングをSlackに投稿
    await fetch(slackWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: `今月のポイントランキング\n${rankingText}`,
      }),
    });

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("エッジファンクションのエラー:", error);
    return new Response(JSON.stringify({ error: error }), {
      status: 500,
    });
  }
});

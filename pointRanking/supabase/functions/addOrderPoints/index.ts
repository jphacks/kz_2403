import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Supabaseの環境変数が正しく設定されていません!!");
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

    const requestJson = await req.json();
    console.log("受信したリクエスト:", requestJson);
    const { messageId, userId, workspaceId } = requestJson;

    if (!messageId || !userId || !workspaceId) {
      console.error("必要なパラメータが不足しています");
      return new Response(
        JSON.stringify({ error: "messageId, userId, workspaceIdは必須です" }),
        {
          status: 400,
          headers: { "Access-Control-Allow-Origin": "*" },
        }
      );
    }

    // リアクションの順番に応じたポイント付与
    const { data: reactions, error: reactionError } = await supabase
      .from("ReactionNew")
      .select("created_at, user_id")
      .eq("message_id", messageId)
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: true });

    if (reactionError) {
      console.error("Reactionテーブルの取得エラー:", reactionError);
      return new Response(JSON.stringify({ error: reactionError.message }), {
        status: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }

    console.log("取得したリアクション一覧:", reactions);

    // リアクションの順番を確認
    const userReactionIndex = reactions.findIndex(
      (reaction) => reaction.user_id === userId
    );

    console.log(`ユーザー${userId}のリアクション順位: ${userReactionIndex + 1}`);

    // リアクション順位に応じたポイントを設定（明示的な条件分岐）
    let points;
    if (userReactionIndex === 0) {
      points = 3;  // 1番目
      console.log("最速リアクション: 3ポイント付与");
    } else if (userReactionIndex === 1) {
      points = 2;  // 2番目
      console.log("2番目のリアクション: 2ポイント付与");
    } else if (userReactionIndex >= 2) {
      points = 1;  // 3番目以降
      console.log("3番目以降のリアクション: 1ポイント付与");
    } else {
      points = 0;  // リアクションが見つからない場合
      console.log("リアクションが見つかりません");
    }

    console.log(`付与するポイント: ${points}`);

    // 現在のtotal_pointを取得して加算
    const { data: user, error: userError } = await supabase
      .from("UserNew")
      .select("total_point")
      .eq("user_id", userId)
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (userError) {
      console.error("Userテーブルの取得エラー:", userError);
      return new Response(JSON.stringify({ error: userError.message }), {
        status: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }

    const currentTotalPoints = user?.total_point || 0;
    const newTotalPoints = currentTotalPoints + points;

    console.log(
      `現在のtotal_point: ${currentTotalPoints}, 新しいtotal_point: ${newTotalPoints}`
    );

    // 更新処理
    const { error: updateError } = await supabase
      .from("UserNew")
      .update({ total_point: newTotalPoints })
      .eq("user_id", userId)
      .eq("workspace_id", workspaceId);

    if (updateError) {
      console.error("ポイント更新エラー:", updateError);
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }

    console.log(
      `ユーザーID: ${userId} に ${points} ポイントを加算し、total_pointを更新しました`
    );

    return new Response(
      JSON.stringify({
        message: "ポイント付与成功",
        reactionIndex: userReactionIndex + 1,
        points,
        newTotalPoints,
      }),
      {
        status: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
      }
    );
  } catch (error) {
    console.error("エッジファンクションのエラー:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }
});
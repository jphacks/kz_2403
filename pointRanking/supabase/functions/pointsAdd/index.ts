import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// DenoでuseSupabaseが使えない為、環墫変数を直接読み込む
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Supabaseのクライアントを作成
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

    const { messageId, reactionUserId } = requestJson;

    // リアクションの順番に応じたポイント付与
    const { data: reactions, error: reactionError } = await supabase
      .from("Reaction")
      .select("created_at, reaction_user_id")
      .eq("message_id", messageId)
      .order("created_at", { ascending: true });

    if (reactionError) {
      console.error("Reactionテーブルの取得エラー:", reactionError);
      return new Response(JSON.stringify({ error: reactionError.message }), {
        status: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }

    console.log("リアクション取得結果:", reactions);

    let points = 0;
    let reactionIndex = -1;

    // リアクションの順番に基づいてポイントを設定
    if (reactions.length > 0) {
      reactionIndex = reactions.findIndex(
        (reaction) => reaction.reaction_user_id === reactionUserId
      );

      if (reactionIndex === 0) {
        points = 3;
      } else if (reactionIndex === 1) {
        points = 2;
      } else {
        points = 1;
      }
    }

    console.log(`リアクションの順番: ${reactionIndex + 1}, 付与ポイント: ${points}`);

    // 現在のtotal_pointを取得して加算
    const { data: user, error: userError } = await supabase
      .from("User")
      .select("total_point")
      .eq("user_id", reactionUserId)
      .single();

    if (userError) {
      console.error("Userテーブルの取得エラー:", userError);
      return new Response(JSON.stringify({ error: userError.message }), {
        status: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }

    const currentTotalPoints = user?.total_point || 0;
    const newTotalPoints = currentTotalPoints + points;

    console.log(`現在のtotal_point: ${currentTotalPoints}, 新しいtotal_point: ${newTotalPoints}`);

    // 更新処理
    const { error: updateError } = await supabase
      .from("User")
      .update({ total_point: newTotalPoints })
      .eq("user_id", reactionUserId);

    if (updateError) {
      console.error("ポイント更新エラー:", updateError);
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }

    console.log(`ユーザーID: ${reactionUserId} に ${points} ポイントを加算し、total_pointを更新しました`);

    return new Response(
      JSON.stringify({
        message: "ポイント付与成功",
        reactionIndex: reactionIndex + 1,
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

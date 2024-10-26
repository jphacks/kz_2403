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
          "Access-Control-Allow-Methods": "POST",
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

    let points = 1;

    if (reactions.length > 0) {
      const reactionIndex = reactions.findIndex(
        (reaction) => reaction.reaction_user_id === reactionUserId
      );

      if (reactionIndex === 0) {
        points = 3;
      } else if (reactionIndex === 1) {
        points = 2;
      }
    }

    // ポイントをユーザーに付与
    const { error: pointError } = await supabase.rpc("increment_total_points", {
      user_id: reactionUserId,
      increment: points,
    });

    if (pointError) {
      console.error("ポイント付与エラー:", pointError);
      return new Response(JSON.stringify({ error: pointError.message }), {
        status: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }

    return new Response(
      JSON.stringify({ message: "ポイント付与成功", points }),
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

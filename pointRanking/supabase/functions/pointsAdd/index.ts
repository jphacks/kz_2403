import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "@supabase/supabase-js";
import { coreHeaders } from "../../core.ts";

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
    // CORSヘッダーを設定
    if (req.method === "OPTIONS") {
      return new Response("OK", { headers: coreHeaders})
    }

    const requestJson = await req.json();
    console.log("受信したリクエスト:", requestJson);

    const { messageId, reactionUserId, reaction } = requestJson;
    
    // 1. リアクションの順番に応じたポイント付与
    const { data: reactions, error: reactionError} = await supabase.from("Reaction").select("created_at, reaction_user_id").eq("message_id", messageId).order("created_at", { ascending: true });

    if (reactionError) {
      console.error("Reactionテーブルの取得エラー:", reactionError);
      return new Response("Error", { status: 500 });
    }

    let points = 1; //デフォルトのポイント

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
      increment: points
    });

    if (pointError) {
      console.error("ポイント付与エラー:", pointError);
      return new Response("Error", { status: 500 });
    }
  }
  catch (error) {
    console.error("エラー:", error);
    return new Response("Error", { status: 500 });
  }
})
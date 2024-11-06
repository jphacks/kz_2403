import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import {
  createClient,
  SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2";

interface RequestBody {
  messageId: string;
  userId: string;
}

// 環境変数の取得
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Supabaseの環境変数が正しく設定されていません!!");
}

// Edge Functionのエントリーポイント
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

    // リクエストボディからパラメータを取得
    const { messageId, userId }: RequestBody = await req.json();

    if (!messageId || !userId) {
      return new Response(
        JSON.stringify({ error: "必要なパラメータが提供されていません" }),
        {
          status: 400,
          headers: { "Access-Control-Allow-Origin": "*" },
        }
      );
    }

    // Supabaseクライアントを作成
    const supabase: SupabaseClient = createClient(
      supabaseUrl,
      supabaseServiceRoleKey
    );

    // メッセージの取得
    const { data: messageData, error: messageError } = await supabase
      .from("Message")
      .select("message_user_id")
      .eq("message_id", messageId)
      .single();

    if (messageError || !messageData) {
      console.error("メッセージ取得エラー:", messageError);
      return new Response(
        JSON.stringify({ error: "メッセージが見つかりません" }),
        {
          status: 500,
          headers: { "Access-Control-Allow-Origin": "*" },
        }
      );
    }

    // ユーザーの現在のtotal_pointを取得
    const { data: userData, error: userError } = await supabase
      .from("User")
      .select("total_point")
      .eq("user_id", userId)
      .single();

    if (userError || !userData) {
      console.error("ユーザー取得エラー:", userError);
      return new Response(
        JSON.stringify({ error: "ユーザーが見つかりません" }),
        {
          status: 500,
          headers: { "Access-Control-Allow-Origin": "*" },
        }
      );
    }

    const currentTotalPoint = userData.total_point || 0;
    const newTotalPoint = currentTotalPoint + 1;

    // Userテーブルのtotal_pointを更新
    const { error: updateError } = await supabase
      .from("User")
      .update({ total_point: newTotalPoint })
      .eq("user_id", userId);

    if (updateError) {
      console.error("ポイント更新エラー:", updateError);
      return new Response(
        JSON.stringify({ error: "ポイントの更新に失敗しました" }),
        {
          status: 500,
          headers: { "Access-Control-Allow-Origin": "*" },
        }
      );
    } else {
      console.log(
        `ユーザーID: ${userId} の total_point を ${newTotalPoint} に更新しました`
      );
      return new Response(
        JSON.stringify({ message: "ポイントを加算しました", newTotalPoint }),
        {
          status: 200,
          headers: { "Access-Control-Allow-Origin": "*" },
        }
      );
    }
  } catch (error) {
    console.error("エッジファンクションのエラー:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }
});

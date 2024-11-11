import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import {
  createClient,
  SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2";
import type { PostgrestError } from "https://esm.sh/@supabase/supabase-js@2";

interface Message {
  message_text: string;
  user_id: string;
}

interface User {
  total_point: number;
}

interface RequestBody {
  messageId: string;
}

// DenoでuseSupabaseが使えない為、環境変数を直接読み込む
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Supabaseの環境変数が正しく設定されていません!!");
}

// @mentionのキーワード
const mentionRegex = /@\w+/;

// エッジファンクションのエントリーポイント
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

    // リクエストボディからmessageIdを取得
    const requestJson: RequestBody = await req.json();
    console.log("受信したリクエスト:", requestJson);

    const { messageId } = requestJson;

    if (!messageId) {
      return new Response(
        JSON.stringify({ error: "messageIdが提供されていません" }),
        {
          status: 400,
          headers: { "Access-Control-Allow-Origin": "*" },
        }
      );
    }

    // Supabaseのクライアントを作成
    const supabase: SupabaseClient = createClient(
      supabaseUrl,
      supabaseServiceRoleKey
    );

    // メッセージの取得
    const { data: messageData, error: messageError } = await supabase
      .from("MessageNew")
      .select("message_text, user_id")
      .eq("message_id", messageId)
      .single();

    if (messageError || !messageData) {
      console.error("メッセージ取得エラー:", messageError);
      return new Response(
        JSON.stringify({
          error:
            (messageError as PostgrestError).message ||
            "メッセージが見つかりません",
        }),
        {
          status: 500,
          headers: { "Access-Control-Allow-Origin": "*" },
        }
      );
    }

    const messageText = (messageData as Message).message_text;
    const userId = messageData.user_id;
    const hasMention = mentionRegex.test(messageText);

    if (hasMention) {
      // ユーザーの現在のtotal_pointを取得
      const { data: userData, error: userError } = await supabase
        .from("UserNew")
        .select("total_point")
        .eq("user_id", userId)
        .single();

      if (userError || !userData) {
        console.error("ユーザー取得エラー:", userError);
        return new Response(
          JSON.stringify({
            error:
              (userError as PostgrestError).message ||
              "ユーザーが見つかりません",
          }),
          {
            status: 500,
            headers: { "Access-Control-Allow-Origin": "*" },
          }
        );
      }

      const currentTotalPoint = (userData as User).total_point || 0;
      const newTotalPoint = currentTotalPoint + 1;

      // Userテーブルのtotal_pointを更新
      const { error: updateError } = await supabase
        .from("User")
        .update({ total_point: newTotalPoint })
        .eq("user_id", userId);

      if (updateError) {
        console.error("ポイント更新エラー:", updateError);
        return new Response(
          JSON.stringify({ error: (updateError as PostgrestError).message }),
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
    } else {
      console.log("キーワードが含まれていないため、ポイントは加算されません");
      return new Response(
        JSON.stringify({
          message: "キーワードが含まれていないため、ポイントは加算されません",
        }),
        {
          status: 200,
          headers: { "Access-Control-Allow-Origin": "*" },
        }
      );
    }
  } catch (error) {
    console.error("エッジファンクションのエラー:", error);

    // errorを型アサーションして、messageプロパティにアクセス
    const errorMessage = error instanceof Error ? error.message : String(error);

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }
});

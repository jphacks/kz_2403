import type {
  MessageReaction,
  PartialMessageReaction,
} from "discord.js";
import { supabase } from "./hooks/useSupabase";
const emoji = require("emoji-toolkit");

// 登録先の任意のテーブル名
const tableName = "D_Emoji"; // 作成したテーブル名に置き換えてください

export async function messageReactionAddHandler(reaction: MessageReaction | PartialMessageReaction) {
  // 部分的なリアクションオブジェクトの場合は完全なデータを取得
  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch (error) {
      console.error("Error fetching reaction:", error);
      return;
    }
  }

  // 絵文字名（カスタム絵文字またはUnicode絵文字の区別）
  const emojiName =
    emoji.toShort(`${reaction.emoji.name}`) || reaction.emoji.name;
  const guildId = reaction.message.guild?.id || null; // サーバーIDを取得

  // Supabaseにデータを登録
  const { data, error } = await supabase.from(tableName).insert([
    {
      emoji_name: emojiName, // 絵文字名
      emoji_id: emojiName, // 絵文字ID
      workspace_id: guildId, // DiscordサーバーID
    },
  ]);

  if (error) {
    console.error("Error saving reaction to Supabase:", error);
  } else {
    console.log("Reaction added to Supabase:", data);
  }
}

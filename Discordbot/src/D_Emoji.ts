import type {
  MessageReaction,
  PartialMessageReaction,
} from "discord.js";
import { supabase } from "./hooks/useSupabase";
const emoji = require("emoji-toolkit");

// 登録先の任意のテーブル名
const tableName = "D_Emoji"; // 作成したテーブル名に置き換えてください
const userTable = 'D_User';

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
  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch (error) {
      console.error('Error fetching reaction:', error);
      return;
    }
  }

  const user = reaction.users.cache.last(); // 直近のユーザーを取得

  if (!user) {
    console.error("No user found for the reaction.");
    return;
  }

  const userId = user.id;

  // ポイントを1加算
  await updateUserPoints(userId, 1);

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

// ユーザーのポイントを加算または減算
const updateUserPoints = async (userId: string, increment: number) => {
  try {
    const { data, error: fetchError } = await supabase
      .from(userTable)
      .select('total_point')
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      console.error('Error fetching user data:', fetchError);
      return;
    }

    if (!data) {
      console.error(`No data found for user_id "${userId}"`);
      return;
    }

    const currentTotalPoints = data.total_point;
    const updatedTotalPoints = currentTotalPoints + increment;

    const { error: updateError } = await supabase
      .from(userTable)
      .update({ total_point: updatedTotalPoints })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating user points:', updateError);
    } else {
      console.log(`User points updated successfully for user_id "${userId}": ${updatedTotalPoints}`);
    }
  } catch (err) {
    console.error('Unexpected error updating user points:', err);
  }
};
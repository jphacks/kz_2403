import {
  MessageReaction,
  PartialMessageReaction,
  User,
  PartialUser,
} from 'discord.js';
import { supabase } from './hooks/useSupabase';

// 登録先のテーブル名
const userTable = 'D_User';

// Reaction削除時の処理
export const messageReactionRemoveHandler = async (reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) => {
  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch (error) {
      console.error('Error fetching reaction:', error);
      return;
    }
  }

  const userId = user.id;

  // ポイントを1減算
  await updateUserPoints(userId, -1);
};

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
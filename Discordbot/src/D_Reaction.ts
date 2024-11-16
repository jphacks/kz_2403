import {
  Client,
  GatewayIntentBits,
  Partials,
  Events,
  MessageReaction,
  PartialMessageReaction,
  User,
  PartialUser,
} from 'discord.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Supabaseクライアントの初期化
const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_API_KEY as string
);

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user?.tag}`);
});

// 登録先のテーブル名
const userTable = 'D_User';

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

// Reaction追加時の処理
client.on(Events.MessageReactionAdd, async (reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) => {
  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch (error) {
      console.error('Error fetching reaction:', error);
      return;
    }
  }

  const userId = user.id;

  // ポイントを1加算
  await updateUserPoints(userId, 1);
});

// Reaction削除時の処理
client.on(Events.MessageReactionRemove, async (reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) => {
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
});

// Discord Botのログイン
client.login(process.env.DISCORD_TOKEN);

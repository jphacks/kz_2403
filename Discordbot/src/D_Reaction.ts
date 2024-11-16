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
const emoji = require('node-emoji');

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

// 登録先の任意のテーブル名
const tableName = 'D_Reaction'; // 作成したテーブル名に置き換えてください

client.on(Events.MessageReactionAdd, async (reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) => {
  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch (error) {
      console.error('Error fetching reaction:', error);
      return;
    }
  }

  const emojiName = emoji.which(`${reaction.emoji.name}`) || reaction.emoji.name;
  const guildId = reaction.message.guild?.id || null; // サーバーIDを取得
  const messageId = reaction.message.id; // メッセージIDを取得
  const userId = user.id; // ユーザーIDを取得
  const reactionId = reaction.emoji.id || reaction.emoji.name; // 絵文字IDを取得

  // Supabaseにデータを登録
  const { data, error } = await supabase.from(tableName).insert([
    {
      emoji_id: emojiName,     // 絵文字ID
      workspace_id: guildId,   // DiscordサーバーID
      message_id: messageId,   // メッセージID
      user_id: userId,         // ユーザーID
      reaction_id: reactionId, // 反応ID
    },
  ]);

  if (error) {
    console.error('Error saving reaction to Supabase:', error);
  } else {
    console.log('Reaction added to Supabase:', data);
  }
});

client.on(Events.MessageReactionRemove, async (reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) => {
  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch (error) {
      console.error('Error fetching reaction:', error);
      return;
    }
  }

  const emojiName = emoji.which(`${reaction.emoji.name}`) || reaction.emoji.name;
  const guildId = reaction.message.guild?.id || null; // サーバーIDを取得
  const messageId = reaction.message.id; // メッセージIDを取得
  const userId = user.id; // ユーザーIDを取得
  const reactionId = reaction.emoji.id || reaction.emoji.name; // 絵文字IDを取得

  // Supabaseにデータを削除
  const { data, error } = await supabase.from(tableName).delete().eq('message_id', messageId).eq('user_id', userId).eq('reaction_id', reactionId);

  if (error) {
    console.error('Error removing reaction from Supabase:', error);
  } else {
    console.log('Reaction removed from Supabase:', data);
  }
});

// Discord Botのログイン
client.login(process.env.DISCORD_TOKEN);

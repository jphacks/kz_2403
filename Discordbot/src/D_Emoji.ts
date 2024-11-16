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
  const emoji = require('emoji-toolkit');
  
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
  const tableName = 'D_Emoji'; // 作成したテーブル名に置き換えてください
  
  client.on(
    Events.MessageReactionAdd,
    async (reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) => {
      // 部分的なリアクションオブジェクトの場合は完全なデータを取得
      if (reaction.partial) {
        try {
          await reaction.fetch();
        } catch (error) {
          console.error('Error fetching reaction:', error);
          return;
        }
      }
  
      // 絵文字名（カスタム絵文字またはUnicode絵文字の区別）
      const emojiName = emoji.toShort(`${reaction.emoji.name}`) || reaction.emoji.name;
      const guildId = reaction.message.guild?.id || null; // サーバーIDを取得
  
      // Supabaseにデータを登録
      const { data, error } = await supabase.from(tableName).insert([
        {
          emoji_name: emojiName,  // 絵文字名
          emoji_id: emojiName,      // 絵文字ID
          workspace_id: guildId,  // DiscordサーバーID
        },
      ]);
      
      if (error) {
        console.error('Error saving reaction to Supabase:', error);
      } else {
        console.log('Reaction added to Supabase:', data);
      }
    }
  );
  
  // Discord Botのログイン
  client.login(process.env.DISCORD_TOKEN);
  
import {
    Client,
    GatewayIntentBits,
    Partials,
    Events,
    Message,
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
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
    partials: [Partials.Message, Partials.Channel],
  });
  
  client.once('ready', () => {
    console.log(`Logged in as ${client.user?.tag}`);
  });
  
  
  client.on(Events.MessageCreate, async (message: Message) => {
    // Botのメッセージは無視する
    if (message.author.bot) return;
  
    // メッセージの詳細を取得
    const messageId = message.id;
    const messageText = message.content;
    const userId = message.author.id;
    const guildId = message.guild?.id || null; // サーバーIDを取得
    const channelId = message.channelId; // チャンネルID
    const userName = message.author.username; // ユーザー名を取得
  
    // 必要なデータが揃っているか確認
    if (!userId || !guildId || !userName) {
      console.error('Missing user_id, workspace_id, or user_name');
      return;
    }
  
    // D_Userテーブルにユーザー情報を登録（または更新）
    const { data: userData, error: userError } = await supabase
    .from('D_User')
    .upsert([
      {
        user_id: userId,
        workspace_id: guildId,
        user_name: userName,
      },
    ], { onConflict: 'user_id,workspace_id' });  // 配列をカンマ区切りの文字列に修正
  
  
    if (userError) {
      console.error('Error saving user to Supabase:', userError);
      return;
    }
  
    // D_Userテーブルにユーザーが存在することを確認
    const { data: userExists, error: userCheckError } = await supabase
      .from('D_User')
      .select('user_id')
      .eq('user_id', userId)
      .eq('workspace_id', guildId)
      .single();
  
    if (userCheckError || !userExists) {
      console.error('User does not exist in D_User table');
      return;
    }
  
    // D_Messageテーブルにメッセージを登録
    const { data: messageData, error: messageError } = await supabase
      .from('D_Message')
      .insert([
        {
          message_id: messageId,
          message_text: messageText,
          user_id: userId,
          workspace_id: guildId,
          channel_id: channelId,
        },
      ]);
  
    if (messageError) {
      console.error('Error saving message to Supabase:', messageError);
    } else {
      console.log('Message added to Supabase:', messageData);
    }
  });
  
    
  // Discord Botのログイン
  client.login(process.env.DISCORD_TOKEN);
  
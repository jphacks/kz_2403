import {
  ActionRowBuilder,
  ButtonBuilder,
    ButtonStyle,
    Message,
    TextChannel,
  } from 'discord.js';
import { supabase } from './hooks/useSupabase';
  
export const messageCreateHandler= async (message: Message) => {
    // Botのメッセージは無視する
    if (message.author.bot) return;
  
    // メッセージの詳細を取得
    const messageId = message.id;
    const messageText = message.content;
    const userId = message.author.id;
    const guildId = message.guild?.id || null; // サーバーIDを取得
    const channelId = message.channelId; // チャンネルID
    const userName = message.author.username; // ユーザー名を取得
    const mentionedUser = message.mentions.users.first();
    const mentionAuthor = message.author;
    const mentionAuthorMap = new Map<string, string>();
    
  
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
      if (mentionedUser) {
        // メンションしたユーザーのIDを保存
        mentionAuthorMap.set(message.id, mentionAuthor.id);
        if (message.channel instanceof TextChannel) {
          try {
            const messageLink = `https://discord.com/channels/${message.guild?.id}/${message.channel.id}/${message.id}`;
    
            await mentionAuthor.send('まだメッセージを確認していません。メンションされたユーザーが確認するとお知らせします。');
    
            const buttonLink = new ButtonBuilder()
              .setLabel(`メッセージを確認`)
              .setStyle(ButtonStyle.Link)
              .setURL(messageLink);
    
            const buttonConfirm = new ButtonBuilder()
              .setCustomId(mentionAuthor.id)
              .setLabel('確認しました！')
              .setStyle(ButtonStyle.Primary)
              .setEmoji('👍');
    
            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(buttonLink, buttonConfirm);
    
            setTimeout(async () => {
              try {
                await mentionedUser.send({
                  content: `${mentionedUser.username}さん、@ ${mentionAuthor.username}からメッセージが届いています。メッセージを確認してください!`,
                  components: [row],
                });
              } catch (error) {
                console.error('Failed to send message to the mentioned user:', error);
              }
            }, 1 * 1000);
          } catch (error) {
            console.error('Error creating button:', error);
          }}
    if (messageError) {
      console.error('Error saving message to Supabase:', messageError);
    } else {
      console.log('Message added to Supabase:', messageData);
    }
  }};

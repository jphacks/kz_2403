import {
  ActionRowBuilder,
  ButtonBuilder,
    ButtonStyle,
    Message,
    TextChannel,
  } from 'discord.js';
import { supabase } from './hooks/useSupabase';
const emoji = require("emoji-toolkit");
import dotenv from 'dotenv';

dotenv.config();


// エラー時に追加する絵文字のセット
const fallbackEmojis = ["🤔", "👍", "🥲", "🤣", "😁", "❤️", "🙌", "😀", "👀", "🔥", "😎", "🌟"];

// 絵文字をランダムに選択する関数
function getRandomEmojis(emojis: string[], count: number): string[] {
  const shuffled = emojis.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}
  
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
    
    console.log(message)
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

      const body = {
        id: messageId,
        text: messageText,
        provider: "discord",
      }

      try {
        console.log(body)
        const res = await fetch(`${process.env.WORKERS_API_URL}/recommend`,{
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
          }
      );
      console.log(res)
      
        if (!res.ok){
          throw new Error(`API error : ${res.status} ${res.statusText}`);
        }
 
        const data = await res.json();
        const recommendedReactions = data.recommendReactions.map((reaction: { emoji: string }) => reaction.emoji);

        for(const reaction of recommendedReactions){
         console.log(emoji.shortnameToUnicode(reaction))
          message.react(emoji.shortnameToUnicode(reaction))
        }
        

      } catch (error) {
        const RandomEmojis = getRandomEmojis(fallbackEmojis,3);
        for (const emoji of RandomEmojis){
          message.react(emoji)
        }
      }
        
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

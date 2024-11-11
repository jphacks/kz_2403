import { Client, GatewayIntentBits, Message, TextChannel, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.once('ready', () => {
  console.log(`Logged in as ${client.user?.tag}`);
});

// メッセージが作成された時に実行される
client.on('messageCreate', async (message: Message) => {
  // Bot自身のメッセージには反応しない
  if (message.author.bot) return;

  // メンションされたユーザーを取得
  const mentionedUser = message.mentions.users.first();
  
  if (mentionedUser) {
    // チャンネルがテキストチャンネルかどうかを確認
    if (message.channel instanceof TextChannel) {
      try {
        // ボタンを作成
        const button = new ButtonBuilder()
          .setCustomId('primary')
          .setLabel('確認しました！')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('👍'); // 絵文字

        // ボタンを含むアクション行を作成
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

        // メンションされたユーザーにDMでメッセージを送信
        setTimeout(async () => {
          try {
            await mentionedUser.send({
              content: `${mentionedUser.username}さん、メッセージを確認してください!`,
              components: [row],
            });
          } catch (error) {
            console.error('Failed to send message to the mentioned user:', error);
          }
        }, 1 * 60 * 1000); // ここで何秒（ミリ秒）か指定
      } catch (error) {
        console.error('Error creating button:', error);
      }

      try {
        // ボタンを作成
        const button = new ButtonBuilder()
          .setCustomId('primary')
          .setLabel('確認しました！')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🙇‍♂️'); // 絵文字

        // ボタンを含むアクション行を作成
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

        // メンションされたユーザーにDMでメッセージを送信
        setTimeout(async () => {
          try {
            await mentionedUser.send({
              content: `${mentionedUser.username}さん、はやくメッセージを確認してください！`,
              components: [row],
            });
          } catch (error) {
            console.error('Failed to send message to the mentioned user:', error);
          }
        }, 2 * 60 * 1000); // ここで何秒（ミリ秒）か指定
      } catch (error) {
        console.error('Error creating button:', error);
      }
    }
  }
});

// ボタンが押された時に実行される
client.on('interactionCreate', async (interaction) => {
  // インタラクションがボタンであるかどうかを確認
  if (!interaction.isButton()) return;

  // ボタンのカスタムIDを確認
  if (interaction.customId === 'primary') {
    // メッセージを削除
    try {
      // ボタンが押されたメッセージを削除
      await interaction.message.delete();
      // ボタンを押したユーザーに確認メッセージを送信
      await interaction.reply({ content: 'メッセージを確認しました！', ephemeral: true });
    } catch (error) {
      console.error('Failed to delete the message:', error);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);

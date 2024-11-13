import { Client, GatewayIntentBits, Message, TextChannel, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.once('ready', () => {
  console.log(`Logged in as ${client.user?.tag}`);
});

// メッセージが作成された時に実行される
client.on('messageCreate', async (message: Message) => {
  if (message.author.bot) return;

  const mentionedUser = message.mentions.users.first();
  const mentionAuthor = message.author;

  if (mentionedUser) {
    if (message.channel instanceof TextChannel) {
      try {
        const messageLink = `https://discord.com/channels/${message.guild?.id}/${message.channel.id}/${message.id}`;

        await mentionAuthor.send(`まだメッセージを確認していません。メンションされたユーザーが確認するとお知らせします。`);

        const buttonLink = new ButtonBuilder()
          .setLabel(`メッセージを確認`)
          .setStyle(ButtonStyle.Link)
          .setURL(messageLink);

        const buttonConfirm = new ButtonBuilder()
          .setCustomId('confirm')
          .setLabel('確認しました！')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('👍');

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(buttonLink, buttonConfirm);

        setTimeout(async () => {
          try {
            await mentionedUser.send({
              content: `${mentionedUser.username}さん、メッセージを確認してください!`,
              components: [row],
            });
          } catch (error) {
            console.error('Failed to send message to the mentioned user:', error);
          }
        }, 1 * 1000);
      } catch (error) {
        console.error('Error creating button:', error);
      }
    }
  }
});

// ボタンが押された時に実行される
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId === 'confirm') {
    const mentionAuthor = interaction.message?.mentions.users.first();

    try {
      await interaction.reply({ content: '確認ありがとう！', ephemeral: true });

      // メンションした人に確認済みメッセージを送信
      if (mentionAuthor) {
        await mentionAuthor.send(`${interaction.user.username}さんがメッセージを確認しました。`);
      }
    } catch (error) {
      console.error('Failed to send confirmation to the mention author:', error);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);

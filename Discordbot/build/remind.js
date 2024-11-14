"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const client = new discord_js_1.Client({ intents: [discord_js_1.GatewayIntentBits.Guilds, discord_js_1.GatewayIntentBits.GuildMessages, discord_js_1.GatewayIntentBits.MessageContent] });
const mentionAuthorMap = new Map();
client.once('ready', () => {
    console.log(`Logged in as ${client.user?.tag}`);
});
client.on('messageCreate', async (message) => {
    if (message.author.bot)
        return;
    const mentionedUser = message.mentions.users.first();
    const mentionAuthor = message.author;
    if (mentionedUser) {
        mentionAuthorMap.set(message.id, mentionAuthor.id);
        if (message.channel instanceof discord_js_1.TextChannel) {
            try {
                const messageLink = `https://discord.com/channels/${message.guild?.id}/${message.channel.id}/${message.id}`;
                await mentionAuthor.send('まだメッセージを確認していません。メンションされたユーザーが確認するとお知らせします。');
                const buttonLink = new discord_js_1.ButtonBuilder()
                    .setLabel(`メッセージを確認`)
                    .setStyle(discord_js_1.ButtonStyle.Link)
                    .setURL(messageLink);
                const buttonConfirm = new discord_js_1.ButtonBuilder()
                    .setCustomId('confirm')
                    .setLabel('確認しました！')
                    .setStyle(discord_js_1.ButtonStyle.Primary)
                    .setEmoji('👍');
                const row = new discord_js_1.ActionRowBuilder().addComponents(buttonLink, buttonConfirm);
                setTimeout(async () => {
                    try {
                        await mentionedUser.send({
                            content: `${mentionedUser.username}さん、@ ${mentionAuthor.username}からメッセージが届いています。メッセージを確認してください!`,
                            components: [row],
                        });
                    }
                    catch (error) {
                        console.error('Failed to send message to the mentioned user:', error);
                    }
                }, 1 * 1000);
            }
            catch (error) {
                console.error('Error creating button:', error);
            }
        }
    }
});
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton())
        return;
    if (interaction.customId === 'confirm') {
        interaction.message?.mentions.users.first();
        try {
            await interaction.reply({ content: '確認ありがとう！', ephemeral: true });
        }
        catch (error) {
            console.error('Failed to send confirmation to the mention author:', error);
        }
    }
    await interaction.user.send('メンションしたユーザーがメッセージを確認しました！');
    await interaction.message.delete();
});
client.login(process.env.DISCORD_TOKEN);

// Expressサーバーを作成（Render用）
const express = require('express'); 
const app = express();
const port = process.env.PORT || 3000;

// Renderにポートをリッスンさせる
app.get('/', (req, res) => {
    res.send('Discord bot is running.');
});

app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const client = new discord_js_1.Client({ intents: [discord_js_1.GatewayIntentBits.Guilds, discord_js_1.GatewayIntentBits.GuildMessages, discord_js_1.GatewayIntentBits.MessageContent] });
client.once('ready', () => {
    console.log(`Logged in as ${client.user?.tag}`);
});
client.on('messageCreate', async (message) => {
    if (message.author.bot)
        return;
    const mentionedUser = message.mentions.users.first();
    const mentionAuthor = message.author;
    if (mentionedUser) {
        if (message.channel instanceof discord_js_1.TextChannel) {
            try {
                const messageLink = `https://discord.com/channels/${message.guild?.id}/${message.channel.id}/${message.id}`;
                await mentionAuthor.send(`まだメッセージを確認していません。メンションされたユーザーが確認するとお知らせします。`);
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
                            content: `${mentionedUser.username}さん、メッセージを確認してください!`,
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
        const mentionAuthor = interaction.message?.mentions.users.first();
        try {
            await interaction.reply({ content: '確認ありがとう！', ephemeral: true });
            if (mentionAuthor) {
                await mentionAuthor.send(`${interaction.user.username}さんがメッセージを確認しました。`);
            }
        }
        catch (error) {
            console.error('Failed to send confirmation to the mention author:', error);
        }
    }
});
client.login(process.env.DISCORD_TOKEN);

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.interactionCreateHandler = void 0;
const useDiscord_1 = require("./hooks/useDiscord");
const useSupabase_1 = require("./hooks/useSupabase");
const discord_js_1 = require("discord.js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const commands = [
    new discord_js_1.SlashCommandBuilder()
        .setName('ranking')
        .setDescription('リアクションのトータルランキング！'),
];
const rest = new discord_js_1.REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN ?? '');
(async () => {
    try {
        console.log('Started refreshing application (/) commands.');
        await rest.put(discord_js_1.Routes.applicationCommands(process.env.CLIENT_ID ?? ''), {
            body: commands.map((command) => command.toJSON()),
        });
        console.log('Successfully reloaded application (/) commands.');
    }
    catch (error) {
        console.error('Error registering commands:', error);
    }
})();
const interactionCreateHandler = async (interaction) => {
    try {
        if (interaction.isButton()) {
            await interaction.reply({ content: '確認ありがとう！', ephemeral: true });
            const mentionAuthor = await useDiscord_1.client.users.fetch(interaction.customId);
            await mentionAuthor.send("メンションしたユーザーがメッセージを確認しました！");
            await interaction.message.delete();
            return;
        }
        if (interaction.isChatInputCommand() && interaction.commandName === 'ranking') {
            const { data, error } = await useSupabase_1.supabase
                .from('D_User')
                .select('user_id, total_point')
                .order('total_point', { ascending: false })
                .limit(5);
            if (error) {
                console.error('Error fetching ranking:', error);
                await interaction.reply('ランキングを取得できませんでした。');
                return;
            }
            if (!data || data.length === 0) {
                await interaction.reply('ランキングデータがありません。');
                return;
            }
            const rankingMessage = data
                .map((item, index) => `${index + 1}. <@${item.user_id}> - ${item.total_point} points`)
                .join('\n');
            await interaction.reply(`**🏆 トータルランキング 🏆**\n\n${rankingMessage}`);
        }
    }
    catch (error) {
        console.error('Unexpected error:', error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp('エラーが発生しました。');
        }
        else {
            await interaction.reply('エラーが発生しました。');
        }
    }
};
exports.interactionCreateHandler = interactionCreateHandler;

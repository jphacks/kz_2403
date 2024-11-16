"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const useSupabase_1 = require("./hooks/useSupabase");
const client = new discord_js_1.Client({
    intents: [],
});
const commands = [
    new discord_js_1.SlashCommandBuilder()
        .setName('ranking')
        .setDescription('Show ranking based on total points'),
];
const rest = new discord_js_1.REST({ version: '10' }).setToken('DISCORD_TOKEN');
(async () => {
    try {
        console.log('Started refreshing application (/) commands.');
        await rest.put(discord_js_1.Routes.applicationCommands('CLIENT_ID'), {
            body: commands.map((command) => command.toJSON()),
        });
        console.log('Successfully reloaded application (/) commands.');
    }
    catch (error) {
        console.error(error);
    }
})();
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand())
        return;
    if (interaction.commandName === 'ranking') {
        try {
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
            await interaction.reply(`**🏆 Total Points Ranking 🏆**\n\n${rankingMessage}`);
        }
        catch (error) {
            console.error('Unexpected error:', error);
            await interaction.reply('ランキングを表示中にエラーが発生しました。');
        }
    }
});

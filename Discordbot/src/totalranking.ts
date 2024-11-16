import { Client, REST, Routes, SlashCommandBuilder } from 'discord.js';
import { supabase } from './hooks/useSupabase';

const client = new Client({
  intents: [],
});


// スラッシュコマンドを登録
const commands = [
  new SlashCommandBuilder()
    .setName('ranking')
    .setDescription('Show ranking based on total points'),
];

const rest = new REST({ version: '10' }).setToken('DISCORD_TOKEN');
(async () => {
  try {
    console.log('Started refreshing application (/) commands.');
    await rest.put(Routes.applicationCommands('CLIENT_ID'), {
      body: commands.map((command) => command.toJSON()),
    });
    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();

// スラッシュコマンドの処理
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'ranking') {
    try {
      // Supabase からランキングを取得
      const { data, error } = await supabase
        .from('D_User') // テーブル名を設定
        .select('user_id, total_point') // 必要なカラムを指定
        .order('total_point', { ascending: false }) // 降順で並べ替え
        .limit(5); // 上位10名を取得

      if (error) {
        console.error('Error fetching ranking:', error);
        await interaction.reply('ランキングを取得できませんでした。');
        return;
      }

      if (!data || data.length === 0) {
        await interaction.reply('ランキングデータがありません。');
        return;
      }

      // ランキングのフォーマット
      const rankingMessage = data
        .map((item: { user_id: any; total_point: any; }, index: number) => `${index + 1}. <@${item.user_id}> - ${item.total_point} points`)
        .join('\n');

      // メッセージを返信
      await interaction.reply(`**🏆 Total Points Ranking 🏆**\n\n${rankingMessage}`);
    } catch (error) {
      console.error('Unexpected error:', error);
      await interaction.reply('ランキングを表示中にエラーが発生しました。');
    }
  }
});

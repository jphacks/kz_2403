import { client } from "./hooks/useDiscord";
import { supabase } from "./hooks/useSupabase";
import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const commands = [
  new SlashCommandBuilder()
    .setName('ranking')
    .setDescription('リアクションのトータルランキング！'),
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN ?? '');
(async () => {
  try {
    console.log('Started refreshing application (/) commands.');
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID ?? ''), {
      body: commands.map((command) => command.toJSON()),
    });
    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error('Error registering commands:', error);
  }
})();


export const interactionCreateHandler = async (interaction: any) => {
  try {
    // ボタンが押された時の処理
    if (interaction.isButton()) {
      await interaction.reply({ content: '確認ありがとう！', ephemeral: true });

      const mentionAuthor = await client.users.fetch(interaction.customId);
      await mentionAuthor.send("メンションしたユーザーがメッセージを確認しました！");
      await interaction.message.delete();
      return;
    }

    // スラッシュコマンドの処理
    if (interaction.isChatInputCommand() && interaction.commandName === 'ranking') {
      const { data, error } = await supabase
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
        .map((item: { user_id: any; total_point: any }, index: number) => `${index + 1}. <@${item.user_id}> - ${item.total_point} points`)
        .join('\n');

      await interaction.reply(`**🏆 トータルランキング 🏆**\n\n${rankingMessage}`);
    }
  } catch (error) {
    console.error('Unexpected error:', error);

    // 応答が未送信の場合はエラーを返す
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp('エラーが発生しました。');
    } else {
      await interaction.reply('エラーが発生しました。');
    }
  }
};

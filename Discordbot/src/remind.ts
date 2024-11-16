import { client } from "./hooks/useDiscord";

// ボタンが押された時に実行される
export const interactionCreateHandler = async (interaction:any) => {
  if (!interaction.isButton()) return;

    try {
      await interaction.reply({ content: '確認ありがとう！', ephemeral: true });

    } catch (error) {
      console.error('Failed to send confirmation to the mention author:', error);
    }
  
    const mentionAuthor = await
  client.users.fetch(interaction.customId);
    await mentionAuthor.send("メンションしたユーザーがメッセージを確認しました！");
  await interaction.message.delete();
};
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.interactionCreateHandler = void 0;
const useDiscord_1 = require("./hooks/useDiscord");
const interactionCreateHandler = async (interaction) => {
    if (!interaction.isButton())
        return;
    try {
        await interaction.reply({ content: '確認ありがとう！', ephemeral: true });
    }
    catch (error) {
        console.error('Failed to send confirmation to the mention author:', error);
    }
    const mentionAuthor = await useDiscord_1.client.users.fetch(interaction.customId);
    await mentionAuthor.send("メンションしたユーザーがメッセージを確認しました！");
    await interaction.message.delete();
};
exports.interactionCreateHandler = interactionCreateHandler;

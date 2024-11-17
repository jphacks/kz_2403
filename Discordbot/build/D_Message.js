"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageCreateHandler = void 0;
const discord_js_1 = require("discord.js");
const useSupabase_1 = require("./hooks/useSupabase");
const emoji = require("emoji-toolkit");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const fallbackEmojis = ["🤔", "👍", "🥲", "🤣", "😁", "❤️", "🙌", "😀", "👀", "🔥", "😎", "🌟"];
function getRandomEmojis(emojis, count) {
    const shuffled = emojis.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}
const messageCreateHandler = async (message) => {
    if (message.author.bot)
        return;
    const messageId = message.id;
    const messageText = message.content;
    const userId = message.author.id;
    const guildId = message.guild?.id || null;
    const channelId = message.channelId;
    const userName = message.author.username;
    const mentionedUser = message.mentions.users.first();
    const mentionAuthor = message.author;
    const mentionAuthorMap = new Map();
    console.log(message);
    if (!userId || !guildId || !userName) {
        console.error('Missing user_id, workspace_id, or user_name');
        return;
    }
    const { data: userData, error: userError } = await useSupabase_1.supabase
        .from('D_User')
        .upsert([
        {
            user_id: userId,
            workspace_id: guildId,
            user_name: userName,
        },
    ], { onConflict: 'user_id,workspace_id' });
    if (userError) {
        console.error('Error saving user to Supabase:', userError);
    }
    const { data: userExists, error: userCheckError } = await useSupabase_1.supabase
        .from('D_User')
        .select('user_id')
        .eq('user_id', userId)
        .eq('workspace_id', guildId)
        .single();
    if (userCheckError || !userExists) {
        console.error('User does not exist in D_User table');
    }
    const { data: messageData, error: messageError } = await useSupabase_1.supabase
        .from('D_Message')
        .insert([
        {
            message_id: messageId,
            message_text: messageText,
            user_id: userId,
            workspace_id: guildId,
            channel_id: channelId,
        },
    ]);
    const body = {
        id: messageId,
        text: messageText,
        provider: "discord",
    };
    try {
        console.log(body);
        const res = await fetch(`${process.env.WORKERS_API_URL}/recommend`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
        console.log(res);
        if (!res.ok) {
            throw new Error(`API error : ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        const recommendedReactions = data.recommendReactions.map((reaction) => reaction.emoji);
        for (const reaction of recommendedReactions) {
            console.log(emoji.shortnameToUnicode(reaction));
            message.react(emoji.shortnameToUnicode(reaction));
        }
    }
    catch (error) {
        const RandomEmojis = getRandomEmojis(fallbackEmojis, 3);
        for (const emoji of RandomEmojis) {
            message.react(emoji);
        }
    }
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
                    .setCustomId(mentionAuthor.id)
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
        if (messageError) {
            console.error('Error saving message to Supabase:', messageError);
        }
        else {
            console.log('Message added to Supabase:', messageData);
        }
    }
};
exports.messageCreateHandler = messageCreateHandler;

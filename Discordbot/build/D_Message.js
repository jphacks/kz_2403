"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_API_KEY);
const client = new discord_js_1.Client({
    intents: [discord_js_1.GatewayIntentBits.Guilds, discord_js_1.GatewayIntentBits.GuildMessages],
    partials: [discord_js_1.Partials.Message, discord_js_1.Partials.Channel],
});
client.once('ready', () => {
    console.log(`Logged in as ${client.user?.tag}`);
});
client.on(discord_js_1.Events.MessageCreate, async (message) => {
    if (message.author.bot)
        return;
    const messageId = message.id;
    const messageText = message.content;
    const userId = message.author.id;
    const guildId = message.guild?.id || null;
    const channelId = message.channelId;
    const userName = message.author.username;
    if (!userId || !guildId || !userName) {
        console.error('Missing user_id, workspace_id, or user_name');
        return;
    }
    const { data: userData, error: userError } = await supabase
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
        return;
    }
    const { data: userExists, error: userCheckError } = await supabase
        .from('D_User')
        .select('user_id')
        .eq('user_id', userId)
        .eq('workspace_id', guildId)
        .single();
    if (userCheckError || !userExists) {
        console.error('User does not exist in D_User table');
        return;
    }
    const { data: messageData, error: messageError } = await supabase
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
    if (messageError) {
        console.error('Error saving message to Supabase:', messageError);
    }
    else {
        console.log('Message added to Supabase:', messageData);
    }
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
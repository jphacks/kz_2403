"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
require("dotenv/config");
const node_emoji_1 = require("node-emoji");
const client = new discord_js_1.Client({
    intents: [discord_js_1.GatewayIntentBits.Guilds, discord_js_1.GatewayIntentBits.GuildMessages, discord_js_1.GatewayIntentBits.MessageContent]
});
client.once('ready', () => {
    console.log(`Logged in as ${client.user?.tag}`);
});
client.on('messageCreate', (message) => {
    if (message.author.bot)
        return;
    const emoji = (0, node_emoji_1.get)(':smile:') ?? '';
    message.react('🤔');
    message.react(emoji);
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
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const useDiscord_1 = require("./hooks/useDiscord");
const discord_js_1 = require("discord.js");
const D_Emoji_1 = require("./D_Emoji");
const D_Message_1 = require("./D_Message");
const D_Reaction_1 = require("./D_Reaction");
const remind_1 = require("./remind");
useDiscord_1.client.on(discord_js_1.Events.MessageReactionAdd, D_Emoji_1.messageReactionAddHandler);
useDiscord_1.client.on(discord_js_1.Events.MessageCreate, D_Message_1.messageCreateHandler);
useDiscord_1.client.on(discord_js_1.Events.MessageReactionRemove, D_Reaction_1.messageReactionRemoveHandler);
useDiscord_1.client.on(discord_js_1.Events.InteractionCreate, remind_1.interactionCreateHandler);

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
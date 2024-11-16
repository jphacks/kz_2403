"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
const emoji = require('emoji-toolkit');
dotenv_1.default.config();
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_API_KEY);
const client = new discord_js_1.Client({
    intents: [discord_js_1.GatewayIntentBits.Guilds, discord_js_1.GatewayIntentBits.GuildMessages, discord_js_1.GatewayIntentBits.GuildMessageReactions],
    partials: [discord_js_1.Partials.Message, discord_js_1.Partials.Channel, discord_js_1.Partials.Reaction],
});
client.once('ready', () => {
    console.log(`Logged in as ${client.user?.tag}`);
});
const tableName = 'D_Emoji';
client.on(discord_js_1.Events.MessageReactionAdd, async (reaction, user) => {
    if (reaction.partial) {
        try {
            await reaction.fetch();
        }
        catch (error) {
            console.error('Error fetching reaction:', error);
            return;
        }
    }
    const emojiName = emoji.toShort(`${reaction.emoji.name}`) || reaction.emoji.name;
    const guildId = reaction.message.guild?.id || null;
    const { data, error } = await supabase.from(tableName).insert([
        {
            emoji_name: emojiName,
            emoji_id: emojiName,
            workspace_id: guildId,
        },
    ]);
    if (error) {
        console.error('Error saving reaction to Supabase:', error);
    }
    else {
        console.log('Reaction added to Supabase:', data);
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
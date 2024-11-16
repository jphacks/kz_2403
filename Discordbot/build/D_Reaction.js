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
    intents: [discord_js_1.GatewayIntentBits.Guilds, discord_js_1.GatewayIntentBits.GuildMessages, discord_js_1.GatewayIntentBits.GuildMessageReactions],
    partials: [discord_js_1.Partials.Message, discord_js_1.Partials.Channel, discord_js_1.Partials.Reaction],
});
client.once('ready', () => {
    console.log(`Logged in as ${client.user?.tag}`);
});
const userTable = 'D_User';
const updateUserPoints = async (userId, increment) => {
    try {
        const { data, error: fetchError } = await supabase
            .from(userTable)
            .select('total_point')
            .eq('user_id', userId)
            .single();
        if (fetchError) {
            console.error('Error fetching user data:', fetchError);
            return;
        }
        if (!data) {
            console.error(`No data found for user_id "${userId}"`);
            return;
        }
        const currentTotalPoints = data.total_point;
        const updatedTotalPoints = currentTotalPoints + increment;
        const { error: updateError } = await supabase
            .from(userTable)
            .update({ total_point: updatedTotalPoints })
            .eq('user_id', userId);
        if (updateError) {
            console.error('Error updating user points:', updateError);
        }
        else {
            console.log(`User points updated successfully for user_id "${userId}": ${updatedTotalPoints}`);
        }
    }
    catch (err) {
        console.error('Unexpected error updating user points:', err);
    }
};
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
    const userId = user.id;
    await updateUserPoints(userId, 1);
});
client.on(discord_js_1.Events.MessageReactionRemove, async (reaction, user) => {
    if (reaction.partial) {
        try {
            await reaction.fetch();
        }
        catch (error) {
            console.error('Error fetching reaction:', error);
            return;
        }
    }
    const userId = user.id;
    await updateUserPoints(userId, -1);
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
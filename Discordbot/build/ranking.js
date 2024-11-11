"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const client = new discord_js_1.Client({
    intents: [discord_js_1.GatewayIntentBits.Guilds, discord_js_1.GatewayIntentBits.GuildMessages, discord_js_1.GatewayIntentBits.GuildMessageReactions],
    partials: [discord_js_1.Partials.Message, discord_js_1.Partials.Channel, discord_js_1.Partials.Reaction],
});
const reactionCounts = new Map();
const commands = [
    new discord_js_1.SlashCommandBuilder()
        .setName('ranking')
        .setDescription('Displays the reaction ranking.'),
];
const rest = new discord_js_1.REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
(async () => {
    try {
        console.log('Started refreshing application (/) commands.');
        await rest.put(discord_js_1.Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commands.map(command => command.toJSON()) });
        console.log('Successfully reloaded application (/) commands.');
    }
    catch (error) {
        console.error(error);
    }
})();
client.once('ready', () => {
    console.log(`Logged in as ${client.user?.tag}`);
});
client.on(discord_js_1.Events.MessageReactionAdd, async (reaction, user) => {
    if (reaction.partial) {
        await reaction.fetch();
    }
    const userId = user.id;
    const emoji = (reaction.emoji.name || reaction.emoji.id || 'unknown');
    if (!reactionCounts.has(userId)) {
        reactionCounts.set(userId, new Map());
    }
    const userReactions = reactionCounts.get(userId);
    userReactions.set(emoji, (userReactions.get(emoji) || 0) + 1);
});
client.on(discord_js_1.Events.MessageReactionRemove, async (reaction, user) => {
    if (reaction.partial) {
        await reaction.fetch();
    }
    const userId = user.id;
    const emoji = (reaction.emoji.name || reaction.emoji.id || 'unknown');
    const userReactions = reactionCounts.get(userId);
    if (userReactions) {
        const newCount = (userReactions.get(emoji) || 1) - 1;
        if (newCount > 0) {
            userReactions.set(emoji, newCount);
        }
        else {
            userReactions.delete(emoji);
        }
    }
});
client.on(discord_js_1.Events.InteractionCreate, async (interaction) => {
    if (!interaction.isCommand())
        return;
    if (interaction.commandName === 'ranking') {
        const sortedUsers = [...reactionCounts.entries()]
            .map(([userId, reactions]) => ({
            userId,
            count: [...reactions.values()].reduce((acc, val) => acc + val, 0)
        }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 3);
        const rankingMessage = sortedUsers.map((user, index) => {
            const member = interaction.guild?.members.cache.get(user.userId);
            return `${index + 1}. ${member?.user.tag || 'Unknown User'} - ${user.count} reactions`;
        }).join('\n') || 'No reactions to display.';
        await interaction.reply({ content: `**Reaction Ranking:**\n${rankingMessage}`, ephemeral: true });
    }
});
client.login(process.env.DISCORD_TOKEN);


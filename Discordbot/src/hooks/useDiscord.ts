import { Client, GatewayIntentBits, Partials } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.MessageContent],
	partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

client.login(process.env.DISCORD_BOT_TOKEN);

client.once('ready', () => {
  console.log(`Logged in as ${client.user?.tag}`);
});

export { client };
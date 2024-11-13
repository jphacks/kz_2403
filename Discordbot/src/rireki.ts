import { Client, GatewayIntentBits, Partials, Events, MessageReaction, PartialMessageReaction, User, PartialUser } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions],
	partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

client.once('ready', () => {
	console.log(`Logged in as ${client.user?.tag}`);
});

// リアクションが追加されたときのイベント
client.on(Events.MessageReactionAdd, async (reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) => {
	// 部分的なリアクションオブジェクトの場合は完全なデータを取得
	if (reaction.partial) {
		try {
			await reaction.fetch();
		} catch (error) {
			console.error('Something went wrong when fetching the message:', error);
			return;
		}
	}

	console.log(` ${user.tag}がリアクションを追加しました！`);
	console.log(`Emoji: ${reaction.emoji.name}`);
});

// リアクションが削除されたときのイベント
client.on(Events.MessageReactionRemove, async (reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) => {
	// 部分的なリアクションオブジェクトの場合は完全なデータを取得
	if (reaction.partial) {
		try {
			await reaction.fetch();
		} catch (error) {
			console.error('Something went wrong when fetching the message:', error);
			return;
		}
	}

	console.log(`${user.tag}がリアクションを削除しました!`);
	console.log(`Emoji: ${reaction.emoji.name}`);
});

client.login(process.env.DISCORD_TOKEN);

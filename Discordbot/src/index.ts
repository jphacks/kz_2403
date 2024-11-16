import { client } from "./hooks/useDiscord";
import { Events } from "discord.js";
import { messageReactionAddHandler } from "./D_Emoji";

client.on(Events.MessageReactionAdd, messageReactionAddHandler);


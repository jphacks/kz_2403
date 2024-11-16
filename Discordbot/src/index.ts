import { client } from "./hooks/useDiscord";
import { Events } from "discord.js";
import { messageReactionAddHandler } from "./D_Emoji";
import { messageCreateHandler } from "./D_Message";
import { messageReactionRemoveHandler } from "./D_Reaction";
import { interactionCreateHandler } from "./remind";

client.on(Events.MessageReactionAdd, messageReactionAddHandler);
client.on(Events.MessageCreate, messageCreateHandler);
client.on(Events.MessageReactionRemove, messageReactionRemoveHandler);
client.on(Events.InteractionCreate, interactionCreateHandler);
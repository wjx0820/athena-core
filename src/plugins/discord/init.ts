import {
  ChannelType,
  Client,
  Events,
  GatewayIntentBits,
  Partials,
  SendableChannels,
  TextChannel
} from 'discord.js';

import { Athena } from "../../core/athena.js";
import { PluginBase } from "../plugin-base.js";

export default class Discord extends PluginBase {
  client!: Client;

  desc() {
    return 'You probably have noticed that you can send and receive messages to and from Discord. For channels, you don\'t have to respond to every message. Just respond when you are asked to do something or have something useful to say. For private chats, you should respond to every message, unless being explicitly told not to. When you receive a message, you can reply to it by calling the "discord/send-message" tool. Be mindful about which chat you are in and the type of the chat before sending a message.';
  }

  async load(athena: Athena) {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
      ],
      partials: [Partials.Channel],
    });
    await this.client.login(this.config.bot_token);

    athena.registerEvent({
      name: "discord/message-received",
      desc: "Triggered when a message is received from Discord.",
      args: {
        id: {
          type: "string",
          desc: "The ID of the message.",
          required: true,
        },
        author: {
          type: "object",
          desc: "The author of the message.",
          required: true,
          of: {
            id: {
              type: "string",
              desc: "The ID of the author.",
              required: true,
            },
            username: {
              type: "string",
              desc: "The username of the author.",
              required: true,
            },
          }
        },
        channel: {
          type: "object",
          desc: "The channel the message is sent to.",
          required: true,
          of: {
            id: {
              type: "string",
              desc: "The ID of the channel.",
              required: true,
            },
            type: {
              type: "string",
              desc: "The type of the channel.",
              required: true,
            },
            name: {
              type: "string",
              desc: "The name of the channel.",
              required: false,
            }
          }
        },
        guild: {
          type: "object",
          desc: "The guild the message is sent to.",
          required: false,
          of: {
            id: {
              type: "string",
              desc: "The ID of the guild.",
              required: true,
            },
            name: {
              type: "string",
              desc: "The name of the guild.",
              required: true,
            },
          }
        },
        reference_message_id: {
          type: "string",
          desc: "The ID of the message being replied to.",
          required: false,
        },
        content: {
          type: "string",
          desc: "The content of the message.",
          required: true,
        },
        timestamp: {
          type: "number",
          desc: "The timestamp of the message.",
          required: true,
        },
      },
    });

    athena.registerTool({
      name: "discord/send-message",
      desc: "Send a message to a chat in Discord.",
      args: {
        channel_id: {
          type: "string",
          desc: "The ID of the channel to send the message to.",
          required: true,
        },
        reply_to_message_id: {
          type: "string",
          desc: "The ID of the message to reply to.",
          required: false,
        },
        content: {
          type: "string",
          desc: "The content of the message.",
          required: true,
        },
      },
      retvals: {
        id: {
          type: "string",
          desc: "The ID of the message sent.",
          required: true,
        }
      },
      fn: async (args: { [key: string]: any }) => {
        const channel = await this.client.channels.fetch(args.channel_id);
        if (!channel) {
          throw new Error("The channel does not exist.");
        }
        if (!channel.isTextBased()) {
          throw new Error("The channel is not text-based.");
        }
        return {
          id: (await (channel as SendableChannels).send({
            content: args.content,
            reply: args.reply_to_message_id ? {
              messageReference: args.reply_to_message_id,
            } : undefined,
          })).id
        };
      },
    });

    athena.on("plugins-loaded", () => {
      this.client.on(Events.MessageCreate, async (message) => {
        if (message.author.bot) {
          return;
        }
        const channel_type = message.channel.type === ChannelType.DM ? "dm" : "guild";
        if (!this.config.allowed_channel_ids.includes(message.channel.id)) {
          if (channel_type === "dm") {
            message.channel.send(`Your channel ID ${message.channel.id} probably don't have access to this bot.`);
          }
          return;
        }
        athena.emitEvent("discord/message-received", {
          id: message.id,
          author: {
            id: message.author.id,
            username: message.author.username,
          },
          channel: {
            id: message.channel.id,
            type: channel_type,
            name: channel_type === "guild" ? (message.channel as TextChannel).name : undefined,
          },
          guild: channel_type === "guild" ? {
            id: message.guild?.id,
            name: message.guild?.name,
          } : undefined,
          reference_message_id: message.reference?.messageId,
          content: message.content,
          timestamp: message.createdTimestamp,
        });
      });
    });

    await new Promise<void>((resolve) => {
      this.client.once(Events.ClientReady, () => {
        resolve();
      });
    });
  }

  async unload(athena: Athena) {
    await this.client.destroy();
    athena.deregisterTool("discord/send-message");
    athena.deregisterEvent("discord/message-received");
  }
}

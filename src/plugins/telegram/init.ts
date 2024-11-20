import TelegramBot from "node-telegram-bot-api";

import { Athena } from "../../core/athena.js";
import { PluginBase } from "../plugin-base.js";

export default class Telegram extends PluginBase {
  athena!: Athena;
  bot!: TelegramBot;

  desc() {
    return `You probably have noticed that you can send and receive messages to and from Telegram. Your name in Telegram is ${this.config.bot_name}. For group chats, you don't have to respond to every message. Just respond when you are asked to do something or have something useful to say. For private chats, you should respond to every message, unless being explicitly told not to. When you receive a message, you can reply to it by calling the "telegram/send-message" tool. Be mindful about which chat you are in and the type of the chat before sending a message.`;
  }

  async load(athena: Athena) {
    this.athena = athena;
    this.bot = new TelegramBot(this.config.bot_token, { polling: true });

    athena.registerEvent({
      name: "telegram/message-received",
      desc: "Triggered when a message is received from Telegram.",
      args: {
        message_id: {
          type: "number",
          desc: "Unique message identifier inside this chat.",
          required: true,
        },
        from: {
          type: "object",
          desc: "Sender of the message.",
          required: false,
          of: {
            id: {
              type: "number",
              desc: "Unique identifier for this user or bot.",
              required: true,
            },
            first_name: {
              type: "string",
              desc: "User's or bot's first name.",
              required: true,
            },
            last_name: {
              type: "string",
              desc: "User's or bot's last name.",
              required: false,
            },
            username: {
              type: "string",
              desc: "User's or bot's username.",
              required: false,
            },
          },
        },
        chat: {
          type: "object",
          desc: "Chat the message belongs to.",
          required: true,
          of: {
            id: {
              type: "number",
              desc: "Unique identifier for this chat.",
              required: true,
            },
            type: {
              type: "string",
              desc: "Type of the chat.",
              required: true,
            },
            title: {
              type: "string",
              desc: "Title, for supergroups, channels and group chats.",
              required: false,
            },
          },
        },
        reply_to_message: {
          type: "object",
          desc: "For replies in the same chat and message thread, the original message.",
          required: false,
          of: {
            message_id: {
              type: "number",
              desc: "Unique message identifier inside this chat.",
              required: true,
            },
            from: {
              type: "object",
              desc: "Sender of the message.",
              required: false,
              of: {
                id: {
                  type: "number",
                  desc: "Unique identifier for this user or bot.",
                  required: true,
                },
                first_name: {
                  type: "string",
                  desc: "User's or bot's first name.",
                  required: true,
                },
                last_name: {
                  type: "string",
                  desc: "User's or bot's last name.",
                  required: false,
                },
                username: {
                  type: "string",
                  desc: "User's or bot's username.",
                  required: false,
                },
              },
            },
            text: {
              type: "string",
              desc: "For text messages, the actual UTF-8 text of the message.",
              required: false,
            },
            date: {
              type: "string",
              desc: "Date the message was sent.",
              required: true,
            },
          },
        },
        text: {
          type: "string",
          desc: "For text messages, the actual UTF-8 text of the message.",
          required: false,
        },
        date: {
          type: "string",
          desc: "Date the message was sent.",
          required: true,
        },
      },
    });

    athena.registerTool({
      name: "telegram/send-message",
      desc: "Send a message to a chat in Telegram.",
      args: {
        chat_id: {
          type: "number",
          desc: "Unique identifier for the target chat or username of the target channel.",
          required: true,
        },
        reply_to_message_id: {
          type: "number",
          desc: "Identifier of the message that will be replied to in the current chat.",
          required: false,
        },
        text: {
          type: "string",
          desc: "Text of the message to be sent, 1-4096 characters after entities parsing.",
          required: true,
        },
      },
      retvals: {
        message_id: {
          type: "number",
          desc: "Unique message identifier inside this chat.",
          required: true,
        },
      },
      fn: async (args: { [key: string]: any }) => {
        const message = await this.bot.sendMessage(args.chat_id, args.text, {
          reply_to_message_id: args.reply_to_message_id,
        });
        return { message_id: message.message_id };
      },
    });

    athena.on("plugins-loaded", () => {
      this.bot.on("message", (msg) => {
        const chatId = msg.chat.id;
        if (!this.config.allowed_chat_ids.includes(chatId)) {
          this.bot.sendMessage(
            chatId,
            `Your chat ID ${chatId} probably don't have access to this bot.`
          );
          return;
        }
        athena.emitEvent("telegram/message-received", {
          message_id: msg.message_id,
          from: msg.from
            ? {
                id: msg.from.id,
                first_name: msg.from.first_name,
                last_name: msg.from.last_name,
                username: msg.from.username,
              }
            : undefined,
          chat: {
            id: msg.chat.id,
            type: msg.chat.type,
            title: msg.chat.title,
          },
          reply_to_message: msg.reply_to_message
            ? {
                message_id: msg.reply_to_message.message_id,
                from: msg.reply_to_message.from
                  ? {
                      id: msg.reply_to_message.from.id,
                      first_name: msg.reply_to_message.from.first_name,
                      last_name: msg.reply_to_message.from.last_name,
                      username: msg.reply_to_message.from.username,
                    }
                  : undefined,
                text: msg.reply_to_message.text,
                date: new Date(msg.reply_to_message.date * 1000).toISOString(),
              }
            : undefined,
          text: msg.text,
          date: new Date(msg.date * 1000).toISOString(),
        });
      });
    });
  }

  async unload() {
    await this.bot.stopPolling();
    this.athena.deregisterTool("telegram/send-message");
    this.athena.deregisterEvent("telegram/message-received");
  }
}

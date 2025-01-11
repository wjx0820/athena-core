import TelegramBot from "node-telegram-bot-api";

import { Athena, Dict } from "../../core/athena.js";
import { PluginBase } from "../plugin-base.js";

export default class Telegram extends PluginBase {
  bot!: TelegramBot;
  me!: TelegramBot.User;

  desc() {
    return `You can send and receive messages to and from Telegram. Your username in Telegram is ${this.me.username} and your display name is ${this.me.first_name}. For group chats, you don't have to respond to every message. Just respond when you are asked to do something or have something useful to say. For private chats, you should respond to every message, unless being explicitly told not to. When you receive a message, you can reply to it by calling the "telegram/send-message" tool. Be mindful about which chat you are in and the type of the chat before sending a message.`;
  }

  async load(athena: Athena) {
    this.bot = new TelegramBot(this.config.bot_token, { polling: true });
    this.me = await this.bot.getMe();

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
            photo: {
              type: "array",
              desc: "Available sizes of the photo.",
              required: false,
              of: {
                type: "object",
                desc: "This object represents one size of a photo or a file / sticker thumbnail.",
                required: true,
                of: {
                  file_id: {
                    type: "string",
                    desc: "Identifier for this file, which can be used to download or reuse the file.",
                    required: true,
                  },
                  width: {
                    type: "number",
                    desc: "Photo width.",
                    required: true,
                  },
                  height: {
                    type: "number",
                    desc: "Photo height.",
                    required: true,
                  },
                  url: {
                    type: "string",
                    desc: "URL of the photo.",
                    required: true,
                  },
                },
              },
            },
            file: {
              type: "object",
              desc: "File in the message.",
              required: false,
              of: {
                file_id: {
                  type: "string",
                  desc: "Identifier for this file, which can be used to download or reuse the file.",
                  required: true,
                },
                file_name: {
                  type: "string",
                  desc: "Original filename as defined by the sender.",
                  required: true,
                },
                file_size: {
                  type: "number",
                  desc: "File size in bytes.",
                  required: true,
                },
                url: {
                  type: "string",
                  desc: "URL of the file.",
                  required: true,
                },
              },
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
        photo: {
          type: "array",
          desc: "Available sizes of the photo.",
          required: false,
          of: {
            type: "object",
            desc: "This object represents one size of a photo or a file / sticker thumbnail.",
            required: true,
            of: {
              file_id: {
                type: "string",
                desc: "Identifier for this file, which can be used to download or reuse the file.",
                required: true,
              },
              width: {
                type: "number",
                desc: "Photo width.",
                required: true,
              },
              height: {
                type: "number",
                desc: "Photo height.",
                required: true,
              },
              url: {
                type: "string",
                desc: "URL of the photo.",
                required: true,
              },
            },
          },
        },
        file: {
          type: "object",
          desc: "File in the message.",
          required: false,
          of: {
            file_id: {
              type: "string",
              desc: "Identifier for this file, which can be used to download or reuse the file.",
              required: true,
            },
            file_name: {
              type: "string",
              desc: "Original filename as defined by the sender.",
              required: true,
            },
            file_size: {
              type: "number",
              desc: "File size in bytes.",
              required: true,
            },
            url: {
              type: "string",
              desc: "URL of the file.",
              required: true,
            },
          },
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
        photo: {
          type: "string",
          desc: "Photo to send. Pass a local filename or a URL.",
          required: false,
        },
        file: {
          type: "string",
          desc: "File to send. Pass a local filename or a URL.",
          required: false,
        },
      },
      retvals: {
        message_id: {
          type: "number",
          desc: "Unique message identifier inside this chat.",
          required: true,
        },
      },
      fn: async (args: Dict<any>) => {
        if (args.photo) {
          const message = await this.bot.sendPhoto(args.chat_id, args.photo, {
            reply_to_message_id: args.reply_to_message_id,
          });
          return { message_id: message.message_id };
        }
        if (args.file) {
          const message = await this.bot.sendDocument(args.chat_id, args.file, {
            reply_to_message_id: args.reply_to_message_id,
          });
          return { message_id: message.message_id };
        }
        const message = await this.bot.sendMessage(args.chat_id, args.text, {
          reply_to_message_id: args.reply_to_message_id,
        });
        return { message_id: message.message_id };
      },
    });

    athena.registerTool({
      name: "telegram/edit-message",
      desc: "Edit a message in Telegram.",
      args: {
        chat_id: {
          type: "number",
          desc: "Unique identifier for the target chat or username of the target channel.",
          required: true,
        },
        message_id: {
          type: "number",
          desc: "Unique message identifier inside this chat.",
          required: true,
        },
        text: {
          type: "string",
          desc: "New text of the message.",
          required: true,
        },
      },
      retvals: {
        status: {
          type: "string",
          desc: "Status of the operation.",
          required: true,
        },
      },
      fn: async (args: Dict<any>) => {
        await this.bot.editMessageText(args.text, {
          chat_id: args.chat_id,
          message_id: args.message_id,
        });
        return { status: "success" };
      },
    });

    athena.registerTool({
      name: "telegram/delete-message",
      desc: "Delete a message in Telegram.",
      args: {
        chat_id: {
          type: "number",
          desc: "Unique identifier for the target chat or username of the target channel.",
          required: true,
        },
        message_id: {
          type: "number",
          desc: "Unique message identifier inside this chat.",
          required: true,
        },
      },
      retvals: {
        status: {
          type: "string",
          desc: "Status of the operation.",
          required: true,
        },
      },
      fn: async (args: Dict<any>) => {
        await this.bot.deleteMessage(args.chat_id, args.message_id);
        return { status: "success" };
      },
    });

    athena.once("plugins-loaded", () => {
      this.bot.on("message", async (msg) => {
        const chatId = msg.chat.id;
        if (!this.config.allowed_chat_ids.includes(chatId)) {
          this.bot.sendMessage(
            chatId,
            `You appear to not have access to Athena, but FYI, your chat ID is ${chatId}.`
          );
          return;
        }
        let photo;
        if (msg.photo) {
          photo = [];
          for (const size of msg.photo) {
            photo.push({
              file_id: size.file_id,
              width: size.width,
              height: size.height,
              url: await this.getFileUrl(size.file_id),
            });
          }
        }
        let reply_to_message_photo;
        if (msg.reply_to_message?.photo) {
          reply_to_message_photo = [];
          for (const size of msg.reply_to_message.photo) {
            reply_to_message_photo.push({
              file_id: size.file_id,
              width: size.width,
              height: size.height,
              url: await this.getFileUrl(size.file_id),
            });
          }
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
                text: msg.reply_to_message.text || msg.reply_to_message.caption,
                photo: reply_to_message_photo,
                file: msg.reply_to_message.document
                  ? {
                      file_id: msg.reply_to_message.document.file_id,
                      file_name: msg.reply_to_message.document.file_name,
                      file_size: msg.reply_to_message.document.file_size,
                      url: await this.getFileUrl(
                        msg.reply_to_message.document.file_id
                      ),
                    }
                  : undefined,
                date: new Date(msg.reply_to_message.date * 1000).toISOString(),
              }
            : undefined,
          text: msg.text || msg.caption,
          photo: photo,
          file: msg.document
            ? {
                file_id: msg.document.file_id,
                file_name: msg.document.file_name,
                file_size: msg.document.file_size,
                url: await this.getFileUrl(msg.document.file_id),
              }
            : undefined,
          date: new Date(msg.date * 1000).toISOString(),
        });
      });
    });
  }

  async unload(athena: Athena) {
    await this.bot.stopPolling();
    athena.deregisterTool("telegram/send-message");
    athena.deregisterTool("telegram/edit-message");
    athena.deregisterTool("telegram/delete-message");
    athena.deregisterEvent("telegram/message-received");
  }

  async getFileUrl(fileId: string) {
    const file = await this.bot.getFile(fileId);
    return `https://api.telegram.org/file/bot${this.config.bot_token}/${file.file_path}`;
  }
}

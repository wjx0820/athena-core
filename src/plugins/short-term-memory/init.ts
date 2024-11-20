import { Athena } from "../../core/athena.js";
import { PluginBase } from "../plugin-base.js";

export default class ShortTermMemory extends PluginBase {
  messages: string[] = [];
  eventCount = 0;

  desc() {
    return `You have a short-term memory. You must put whatever you think is the most important to remember in the current context in your short-term memory whenever you feel like it. It is crucial because the context and prompts for you, and even your own thinking can go away at any time. Use the "short-term-memory" tools to manipulate your short-term memory. The short-term memory content should be very specific. Try to include as much detail as possible. You can have a maximum of ${
      this.config.max_messages
    } messages in your short-term memory and each message can have a maximum of ${
      this.config.max_length
    } characters. Here are your current short-term memory messages: ${JSON.stringify(
      this.messages
    )}`;
  }

  async load(athena: Athena) {
    athena.registerEvent({
      name: "short-term-memory/notification",
      desc: "You will be notified periodically to update your short-term memory.",
      args: {
        message: {
          type: "string",
          desc: "The notification message.",
          required: true,
        },
      },
    });
    athena.registerTool({
      name: "short-term-memory/add-message",
      desc: "Adds a message to your short-term memory.",
      args: {
        message: {
          type: "string",
          desc: "The message to add to your short-term memory.",
          required: true,
        },
      },
      retvals: {
        status: {
          type: "string",
          desc: "The status of the operation.",
          required: true,
        },
      },
      fn: async (args: { [key: string]: any }) => {
        if (this.messages.length >= this.config.max_messages) {
          throw new Error(
            `Short-term memory is full. You can have a maximum of ${this.config.max_messages} messages in your short-term memory. Try to remove or edit some messages first.`
          );
        }
        if (args.message.length > this.config.max_length) {
          throw new Error(
            `Message is too long. Each message can have a maximum of ${this.config.max_length} characters.`
          );
        }
        this.messages.push(args.message);
        return { status: "success" };
      },
    });
    athena.registerTool({
      name: "short-term-memory/remove-message",
      desc: "Removes a message from your short-term memory.",
      args: {
        index: {
          type: "number",
          desc: "The index of the message to remove from your short-term memory.",
          required: true,
        },
      },
      retvals: {
        status: {
          type: "string",
          desc: "The status of the operation.",
          required: true,
        },
      },
      fn: async (args: { [key: string]: any }) => {
        if (args.index < 0 || args.index >= this.messages.length) {
          throw new Error(
            `Invalid index. The index must be between 0 and ${
              this.messages.length - 1
            }.`
          );
        }
        this.messages.splice(args.index, 1);
        return { status: "success" };
      },
    });
    athena.registerTool({
      name: "short-term-memory/edit-message",
      desc: "Edits a message in your short-term memory.",
      args: {
        index: {
          type: "number",
          desc: "The index of the message to edit in your short-term memory.",
          required: true,
        },
        message: {
          type: "string",
          desc: "The new message to replace the old message in your short-term memory.",
          required: true,
        },
      },
      retvals: {
        status: {
          type: "string",
          desc: "The status of the operation.",
          required: true,
        },
      },
      fn: async (args: { [key: string]: any }) => {
        if (args.index < 0 || args.index >= this.messages.length) {
          throw new Error(
            `Invalid index. The index must be between 0 and ${
              this.messages.length - 1
            }.`
          );
        }
        if (args.message.length > this.config.max_length) {
          throw new Error(
            `Message is too long. Each message can have a maximum of ${this.config.max_length} characters.`
          );
        }
        this.messages[args.index] = args.message;
        return { status: "success" };
      },
    });
    athena.on("event", () => {
      this.eventCount++;
      if (this.eventCount % this.config.period === 0) {
        athena.emit("event", "short-term-memory/notification", {
          message:
            'You should update your short-term memory. You should now add/remove/edit messages in your short-term memory using the "short-term-memory" tools as you see fit.',
        });
      }
    });
  }

  async unload(athena: Athena) {
    athena.deregisterTool("short-term-memory/add-message");
    athena.deregisterTool("short-term-memory/remove-message");
    athena.deregisterTool("short-term-memory/edit-message");
  }
}

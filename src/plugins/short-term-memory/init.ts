import { Athena, Dict } from "../../core/athena.js";
import { PluginBase } from "../plugin-base.js";

export default class ShortTermMemory extends PluginBase {
  messages: string[] = [];

  desc() {
    return `You have a short-term memory. You must put whatever you think is the most important to remember in the current context in it. Try to put the task you are currently working on or will work on in the future, including any progress you have made in it. It is crucial because the context and prompts for you, and even your own thinking can disappear at any time. The short-term memory content should be very specific. Try to include as much detail as possible so you can recall even if the context disappears. You can have a maximum of ${
      this.config.max_messages
    } messages in your short-term memory and each message can have a maximum of ${
      this.config.max_length
    } characters. Here are your current short-term memory messages: ${JSON.stringify(
      this.messages
    )}`;
  }

  async load(athena: Athena) {
    athena.registerTool({
      name: "short-term-memory/add",
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
      fn: async (args: Dict<any>) => {
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
      name: "short-term-memory/remove",
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
      fn: async (args: Dict<any>) => {
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
      name: "short-term-memory/edit",
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
      fn: async (args: Dict<any>) => {
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
  }

  async unload(athena: Athena) {
    athena.deregisterTool("short-term-memory/add");
    athena.deregisterTool("short-term-memory/remove");
    athena.deregisterTool("short-term-memory/edit");
  }

  state() {
    return { messages: this.messages };
  }

  setState(state: Dict<any>) {
    this.messages = state.messages;
  }
}

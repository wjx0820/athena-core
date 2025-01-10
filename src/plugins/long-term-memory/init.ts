import { Athena, Dict } from "../../core/athena.js";
import { PluginBase } from "../plugin-base.js";

interface ILongTermMemoryItem {
  desc: string;
  data: Dict<any>;
  created_at: string;
}

export default class LongTermMemory extends PluginBase {
  store: Dict<ILongTermMemoryItem> = {};

  desc() {
    return "You have a long-term memory. You must put whatever you think a human would remember long-term in here. This could be knowledge, experiences, or anything else you think is important. It's a key-value store. The key is a string, and the value is a JSON object. You will override the value if you store the same key again. If you want to recall something, you should list and/or retrieve it.";
  }

  async load(athena: Athena) {
    athena.registerTool({
      name: "long-term-memory/store",
      desc: "Store some data to your long-term memory.",
      args: {
        key: {
          type: "string",
          desc: "The key to store the data.",
          required: true,
        },
        desc: {
          type: "string",
          desc: "A description of the data.",
          required: true,
        },
        data: {
          type: "object",
          desc: "The data to store.",
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
        this.store[args.key] = {
          desc: args.desc,
          data: args.data,
          created_at: new Date().toString(),
        };
        return { status: "success" };
      },
    });
    athena.registerTool({
      name: "long-term-memory/remove",
      desc: "Remove data from your long-term memory.",
      args: {
        key: {
          type: "string",
          desc: "The key to remove the data.",
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
        delete this.store[args.key];
        return { status: "success" };
      },
    });
    athena.registerTool({
      name: "long-term-memory/list",
      desc: "List your long-term memory.",
      args: {},
      retvals: {
        list: {
          type: "array",
          desc: "The list of metadata of the long-term memory.",
          required: true,
          of: {
            type: "object",
            desc: "The metadata of the long-term memory.",
            required: false,
            of: {
              key: {
                type: "string",
                desc: "The key of the data.",
                required: true,
              },
              desc: {
                type: "string",
                desc: "The description of the data.",
                required: true,
              },
              created_at: {
                type: "string",
                desc: "The creation date of the data.",
                required: true,
              },
            },
          },
        },
      },
      fn: async (args: Dict<any>) => {
        const list = Object.keys(this.store).map((key) => {
          return {
            key: key,
            desc: this.store[key].desc,
            created_at: this.store[key].created_at,
          };
        });
        return { list: list };
      },
    });
    athena.registerTool({
      name: "long-term-memory/retrieve",
      desc: "Retrieve data from your long-term memory.",
      args: {
        key: {
          type: "string",
          desc: "The key to retrieve the data.",
          required: true,
        },
      },
      retvals: {
        desc: {
          type: "string",
          desc: "The description of the data.",
          required: true,
        },
        data: {
          type: "object",
          desc: "The data.",
          required: true,
        },
        created_at: {
          type: "string",
          desc: "The creation date of the data.",
          required: true,
        },
      },
      fn: async (args: Dict<any>) => {
        const item = this.store[args.key];
        if (!item) {
          return { error: "The key does not exist." };
        }
        return {
          desc: item.desc,
          data: item.data,
          created_at: item.created_at,
        };
      },
    });
  }

  async unload(athena: Athena) {
    athena.deregisterTool("long-term-memory/store");
    athena.deregisterTool("long-term-memory/remove");
    athena.deregisterTool("long-term-memory/list");
    athena.deregisterTool("long-term-memory/retrieve");
  }

  state() {
    return { store: this.store };
  }

  setState(state: Dict<any>) {
    this.store = state.store;
  }
}

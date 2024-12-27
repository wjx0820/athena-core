import { promises as fs } from "fs";

import { Athena } from "../../core/athena.js";
import { PluginBase } from "../plugin-base.js";

export default class FileSystem extends PluginBase {
  desc() {
    return null;
  }

  async load(athena: Athena) {
    athena.registerTool({
      name: "fs/list",
      desc: "List a directory",
      args: {
        path: {
          type: "string",
          desc: "The path to list",
          required: true
        }
      },
      retvals: {
        content: {
          type: "array",
          desc: "The content of the directory",
          required: true,
          of: {
            type: "object",
            desc: "The file or directory",
            required: true,
            of: {
              name: {
                type: "string",
                desc: "The name of the file or directory",
                required: true
              },
              type: {
                type: "string",
                desc: "The type of the file or directory",
                required: true
              }
            }
          }
        }
      },
      fn: async (args: { [key: string]: any }) => {
        const content = await fs.readdir(args.path, { withFileTypes: true });
        return {
          content: content.map((entry) => ({
            name: entry.name,
            type: entry.isDirectory() ? "directory" : "file"
          }))
        };
      },
    });
    athena.registerTool({
      name: "fs/read",
      desc: "Read a file",
      args: {
        path: {
          type: "string",
          desc: "The path to the file",
          required: true
        }
      },
      retvals: {
        content: {
          type: "string",
          desc: "The content of the file",
          required: true
        }
      },
      fn: async (args: { [key: string]: any }) => {
        return { content: await fs.readFile(args.path, "utf8") };
      },
    });
  }

  async unload(athena: Athena) {
    athena.deregisterTool("fs/list");
    athena.deregisterTool("fs/read");
  }
}

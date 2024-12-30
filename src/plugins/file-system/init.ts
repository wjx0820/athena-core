import { promises as fs } from "fs";

import { Athena } from "../../core/athena.js";
import { PluginBase } from "../plugin-base.js";

export default class FileSystem extends PluginBase {
  desc() {
    return `The home directory is ${process.env.HOME}. The current working directory is ${process.cwd()}.`;
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
              },
              size: {
                type: "number",
                desc: "The size of the file in bytes",
                required: false
              }
            }
          }
        }
      },
      fn: async (args: { [key: string]: any }) => {
        const content = await fs.readdir(args.path, { withFileTypes: true });
        const ret = [];
        for (const entry of content) {
          ret.push({
            name: entry.name,
            type: entry.isDirectory() ? "directory" : "file",
            size: entry.isFile() ? (await fs.stat(`${args.path}/${entry.name}`)).size : null
          });
        }
        return { content: ret };
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
    athena.registerTool({
      name: "fs/write",
      desc: "Write to a file",
      args: {
        path: {
          type: "string",
          desc: "The path to the file",
          required: true
        },
        content: {
          type: "string",
          desc: "The content to write",
          required: true
        }
      },
      retvals: {
        status: {
          type: "string",
          desc: "The status of the write operation",
          required: true
        }
      },
      fn: async (args: { [key: string]: any }) => {
        await fs.writeFile(args.path, args.content, "utf8")
        return { status: "success" };
      },
    });
    athena.registerTool({
      name: "fs/delete",
      desc: "Delete a file or directory",
      args: {
        path: {
          type: "string",
          desc: "The path to the file or directory",
          required: true
        }
      },
      retvals: {
        status: {
          type: "string",
          desc: "The status of the delete operation",
          required: true
        }
      },
      fn: async (args: { [key: string]: any }) => {
        await fs.rm(args.path, { recursive: true });
        return { status: "success" };
      },
    });
    athena.registerTool({
      name: "fs/copy",
      desc: "Copy a file or directory",
      args: {
        src: {
          type: "string",
          desc: "The source path",
          required: true
        },
        dst: {
          type: "string",
          desc: "The destination path",
          required: true
        }
      },
      retvals: {
        status: {
          type: "string",
          desc: "The status of the copy operation",
          required: true
        }
      },
      fn: async (args: { [key: string]: any }) => {
        const stat = await fs.stat(args.src);
        if (stat.isFile()) {
          await fs.copyFile(args.src, args.dst);
        } else if (stat.isDirectory()) {
          await fs.cp(args.src, args.dst, { recursive: true });
        } else {
          throw new Error("Unknown file type");
        }
        return { status: "success" };
      },
    });
    athena.registerTool({
      name: "fs/move",
      desc: "Move or rename a file or directory",
      args: {
        src: {
          type: "string",
          desc: "The source path",
          required: true
        },
        dst: {
          type: "string",
          desc: "The destination path",
          required: true
        }
      },
      retvals: {
        status: {
          type: "string",
          desc: "The status of the move operation",
          required: true
        }
      },
      fn: async (args: { [key: string]: any }) => {
        await fs.rename(args.src, args.dst);
        return { status: "success" };
      },
    });
    athena.registerTool({
      name: "fs/mkdir",
      desc: "Create a directory recursively",
      args: {
        path: {
          type: "string",
          desc: "The path to the directory",
          required: true
        }
      },
      retvals: {
        status: {
          type: "string",
          desc: "The status of the mkdir operation",
          required: true
        }
      },
      fn: async (args: { [key: string]: any }) => {
        await fs.mkdir(args.path, { recursive: true });
        return { status: "success" };
      }
    });
  }

  async unload(athena: Athena) {
    athena.deregisterTool("fs/list");
    athena.deregisterTool("fs/read");
    athena.deregisterTool("fs/write");
    athena.deregisterTool("fs/delete");
    athena.deregisterTool("fs/copy");
    athena.deregisterTool("fs/move");
    athena.deregisterTool("fs/mkdir");
  }
}

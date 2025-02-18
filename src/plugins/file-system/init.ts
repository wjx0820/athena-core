import { promises as fs } from "fs";

import { isBinary } from "istextorbinary";

import { Athena, Dict } from "../../core/athena.js";
import { PluginBase } from "../plugin-base.js";

export default class FileSystem extends PluginBase {
  desc() {
    return `The home directory is ${
      process.env.HOME
    }. The current working directory is ${process.cwd()}. The operating system is ${
      process.platform
    }.`;
  }

  async load(athena: Athena) {
    athena.registerTool({
      name: "fs/list",
      desc: "List a directory",
      args: {
        path: {
          type: "string",
          desc: "The path to list",
          required: true,
        },
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
                required: true,
              },
              type: {
                type: "string",
                desc: "The type of the file or directory",
                required: true,
              },
              size: {
                type: "number",
                desc: "The size of the file in bytes",
                required: false,
              },
            },
          },
        },
      },
      fn: async (args: Dict<any>) => {
        const content = await fs.readdir(args.path, { withFileTypes: true });
        const ret = [];
        for (const entry of content) {
          ret.push({
            name: entry.name,
            type: entry.isDirectory() ? "directory" : "file",
            size: entry.isFile()
              ? (await fs.stat(`${args.path}/${entry.name}`)).size
              : undefined,
          });
        }
        return { content: ret };
      },
      explain_args: (args: Dict<any>) => ({
        summary: `Listing the directory ${args.path}...`,
      }),
      explain_retvals: (args: Dict<any>, retvals: Dict<any>) => ({
        summary: `The directory ${args.path} is successfully listed.`,
        details: retvals.content.map((item: Dict<any>) => item.name).join(", "),
      }),
    });
    athena.registerTool({
      name: "fs/read",
      desc: "Read a file. This tool cannot be used to read binary files.",
      args: {
        path: {
          type: "string",
          desc: "The path to the file",
          required: true,
        },
      },
      retvals: {
        content: {
          type: "string",
          desc: "The content of the file",
          required: true,
        },
      },
      fn: async (args: Dict<any>) => {
        const buffer = await fs.readFile(args.path);
        if (isBinary(args.path, buffer)) {
          throw new Error("File is binary");
        }
        return { content: buffer.toString("utf8") };
      },
      explain_args: (args: Dict<any>) => ({
        summary: `Reading the file ${args.path}...`,
      }),
      explain_retvals: (args: Dict<any>, retvals: Dict<any>) => ({
        summary: `The file ${args.path} is successfully read.`,
        details: retvals.content,
      }),
    });
    athena.registerTool({
      name: "fs/write",
      desc: "Write to a file",
      args: {
        path: {
          type: "string",
          desc: "The path to the file",
          required: true,
        },
        content: {
          type: "string",
          desc: "The content to write",
          required: true,
        },
      },
      retvals: {
        status: {
          type: "string",
          desc: "The status of the write operation",
          required: true,
        },
      },
      fn: async (args: Dict<any>) => {
        await fs.writeFile(args.path, args.content, "utf8");
        return { status: "success" };
      },
      explain_args: (args: Dict<any>) => ({
        summary: `Writing to the file ${args.path}...`,
        details: args.content,
      }),
    });
    athena.registerTool({
      name: "fs/delete",
      desc: "Delete a file or directory",
      args: {
        path: {
          type: "string",
          desc: "The path to the file or directory",
          required: true,
        },
      },
      retvals: {
        status: {
          type: "string",
          desc: "The status of the delete operation",
          required: true,
        },
      },
      fn: async (args: Dict<any>) => {
        await fs.rm(args.path, { recursive: true });
        return { status: "success" };
      },
      explain_args: (args: Dict<any>) => ({
        summary: `Deleting the file or directory ${args.path}...`,
      }),
    });
    athena.registerTool({
      name: "fs/copy",
      desc: "Copy a file or directory",
      args: {
        src: {
          type: "string",
          desc: "The source path",
          required: true,
        },
        dst: {
          type: "string",
          desc: "The destination path",
          required: true,
        },
      },
      retvals: {
        status: {
          type: "string",
          desc: "The status of the copy operation",
          required: true,
        },
      },
      fn: async (args: Dict<any>) => {
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
      explain_args: (args: Dict<any>) => ({
        summary: `Copying the file or directory ${args.src} to ${args.dst}...`,
      }),
    });
    athena.registerTool({
      name: "fs/move",
      desc: "Move or rename a file or directory",
      args: {
        src: {
          type: "string",
          desc: "The source path",
          required: true,
        },
        dst: {
          type: "string",
          desc: "The destination path",
          required: true,
        },
      },
      retvals: {
        status: {
          type: "string",
          desc: "The status of the move operation",
          required: true,
        },
      },
      fn: async (args: Dict<any>) => {
        await fs.rename(args.src, args.dst);
        return { status: "success" };
      },
      explain_args: (args: Dict<any>) => ({
        summary: `Moving or renaming the file or directory ${args.src} to ${args.dst}...`,
      }),
    });
    athena.registerTool({
      name: "fs/mkdir",
      desc: "Create a directory recursively",
      args: {
        path: {
          type: "string",
          desc: "The path to the directory",
          required: true,
        },
      },
      retvals: {
        status: {
          type: "string",
          desc: "The status of the mkdir operation",
          required: true,
        },
      },
      fn: async (args: Dict<any>) => {
        await fs.mkdir(args.path, { recursive: true });
        return { status: "success" };
      },
      explain_args: (args: Dict<any>) => ({
        summary: `Creating the directory ${args.path}...`,
      }),
    });
    athena.registerTool({
      name: "fs/cd",
      desc: "Change the current working directory.",
      args: {
        directory: {
          type: "string",
          desc: "Directory to change to. Could be an absolute or relative path.",
          required: true,
        },
      },
      retvals: {
        result: {
          desc: "Result of the cd command",
          required: true,
          type: "string",
        },
      },
      fn: async (args: Dict<any>) => {
        process.chdir(args.directory);
        return { result: "success" };
      },
      explain_args: (args: Dict<any>) => ({
        summary: `Changing the current working directory to ${args.directory}...`,
      }),
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
    athena.deregisterTool("fs/cd");
  }
}

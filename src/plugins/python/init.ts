import { PythonShell } from "python-shell";

import { Athena } from "../../core/athena.js";
import { PluginBase } from "../plugin-base.js";

export default class Interpreter extends PluginBase {
  async load(athena: Athena) {
    athena.registerTool({
      name: "python/exec",
      desc: "Executes Python code. Whenever you need to run Python code, or the user's request requires running Python code, use this tool. You must print the final result to get it. Otherwise the stdout will be empty.",
      args: {
        code: {
          type: "string",
          desc: "Python code",
          required: true
        },
      },
      retvals: {
        stdout: {
          type: "string",
          desc: "Standard output of the code",
          required: true
        },
      },
      fn: async (args: { [key: string]: any }) => {
        return { stdout: (await PythonShell.runString(args.code)).join("\n") };
      },
    });
    athena.registerTool({
      name: "python/exec-file",
      desc: "Executes Python code from a file. Whenever you need to run a Python file, or the user's request requires running Python file, use this tool.",
      args: {
        path: {
          type: "string",
          desc: "Path to the Python file",
          required: true
        },
        args: {
          type: "array",
          desc: "Arguments to pass to the Python file",
          required: false,
          of: {
            type: "string",
            desc: "Argument to pass",
            required: true
          }
        }
      },
      retvals: {
        stdout: {
          desc: "Standard output of the code",
          required: true,
          type: "string",
        },
      },
      fn: async (args: { [key: string]: any }) => {
        return { stdout: (await PythonShell.run(args.path, { args: args.args })).join("\n") };
      },
    });
  }

  async unload(athena: Athena) {
    athena.deregisterTool("python/exec");
    athena.deregisterTool("python/exec-file");
  }
}

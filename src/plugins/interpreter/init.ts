import { PythonShell } from "python-shell";

import { Athena } from "../../core/athena.js";
import { PluginBase } from "../plugin-base.js";

export default class Interpreter extends PluginBase {
  desc() {
    return null;
  }

  async load(athena: Athena) {
    athena.registerTool({
      name: "interpreter/python",
      desc: "Python interpreter. Whenever you need to run Python code, or the user's request requires running Python code, use this tool. Prints in the code will be captured and returned as a string.",
      args: {
        code: {
          desc: "Python code",
          required: true,
          type: "string",
        },
      },
      retvals: {
        result: {
          desc: "Python code result",
          required: true,
          type: "string",
        },
      },
      fn: async (args: { [key: string]: any }) => {
        return { result: (await PythonShell.runString(args.code)).join("\n") };
      },
    });
  }

  async unload(athena: Athena) {
    athena.deregisterTool("interpreter/python");
  }
}

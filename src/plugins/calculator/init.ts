import safeEval from "safe-eval";

import { Athena } from "../../core/athena.js";
import { PluginBase } from "../plugin-base.js";

export default class Calculator extends PluginBase {
  athena!: Athena;

  desc() {
    return null;
  }

  async load(athena: Athena) {
    this.athena = athena;
    athena.registerTool({
      name: "calculator/evaluate",
      desc: "Evaluates a mathematical expression.",
      args: {
        expression: {
          type: "string",
          desc: "The mathematical expression to evaluate. Can be any valid JavaScript expression. You can even execute functions. Under the hood, this uses the safe-eval library.",
          required: true,
        },
      },
      retvals: {
        result: {
          type: "number",
          desc: "The result of the expression.",
          required: true,
        },
      },
      fn: async (args: { [key: string]: any }) => {
        return { result: safeEval(args.expression) };
      },
    });
  }

  async unload() {
    this.athena.deregisterTool("calculator/evaluate");
  }
}

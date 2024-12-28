import { Athena } from "../../core/athena.js";
import { PluginBase } from "../plugin-base.js";
import { OpenAIClient } from "../../utils/openai.js";

export default class Llm extends PluginBase {
  openai!: OpenAIClient;

  async load(athena: Athena) {
    this.openai = new OpenAIClient(this.config.base_url, this.config.api_key);
    athena.registerTool({
      name: "llm/chat",
      desc: "Chat with the LLM.",
      args: {
        message: {
          type: "string",
          desc: "The message to send to the LLM.",
          required: true,
        },
        model: {
          type: "string",
          desc: `The model to use. Available models: ${JSON.stringify(
            this.config.models
          )}`,
          required: true,
        },
        temperature: {
          type: "number",
          desc: "The temperature to use. 0 is the most deterministic, 1 is the most random.",
          required: false,
        },
      },
      retvals: {
        result: {
          type: "string",
          desc: "The result of the LLM.",
          required: true,
        },
      },
      fn: async (args: any) => {
        return {
          result: (
            await this.openai.chatCompletion(
              [{ role: "user", content: args.message }],
              args.model,
              args.temperature
            )
          ).choices[0].message.content,
        };
      },
    });
  }

  async unload(athena: Athena) {
    athena.deregisterTool("llm/chat");
  }
}

import { Athena } from "../../core/athena.js";
import { PluginBase } from "../plugin-base.js";

export default class Http extends PluginBase {
  async load(athena: Athena) {
    athena.registerTool({
      name: "http/fetch",
      desc: "Fetches an HTTP/HTTPS URL.",
      args: {
        url: {
          type: "string",
          desc: "The URL to fetch.",
          required: true,
        },
      },
      retvals: {
        result: {
          type: "string",
          desc: "The result of the fetch.",
          required: true,
        },
      },
      fn: async (args: { [key: string]: any }) => {
        const response = await fetch(`https://r.jina.ai/${args.url}`);
        return { result: await response.text() };
      },
    });
  }

  async unload(athena: Athena) {
    athena.deregisterTool("http/fetch");
  }
}

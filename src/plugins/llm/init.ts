import OpenAI from "openai";
import { ChatCompletionContentPart } from "openai/resources/index.js";

import { Athena } from "../../core/athena.js";
import { PluginBase } from "../plugin-base.js";

export default class Llm extends PluginBase {
  openai!: OpenAI;

  async load(athena: Athena) {
    this.openai = new OpenAI({
      baseURL: this.config.base_url,
      apiKey: this.config.api_key,
    });
    athena.registerTool({
      name: "llm/chat",
      desc: "Chat with the LLM.",
      args: {
        message: {
          type: "string",
          desc: "The message to send to the LLM.",
          required: true,
        },
        image: {
          type: "string",
          desc: "The image URL to send to the LLM, if you want to send an image. You can only send images to models that support them. Don't send the image URL in the message.",
          required: false,
        },
        model: {
          type: "string",
          desc: `The model to use. Available models: ${JSON.stringify(
            this.config.models.chat
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
        citations: {
          type: "array",
          desc: "The citations of the LLM.",
          required: false,
          of: {
            type: "string",
            desc: "The citation of the LLM.",
            required: true,
          },
        },
      },
      fn: async (args: any) => {
        const response = await this.openai.chat.completions.create({
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: args.message,
                },
                ...(args.image
                  ? [
                      {
                        type: "image_url",
                        image_url: {
                          url: args.image,
                        },
                      },
                    ]
                  : []),
              ] as ChatCompletionContentPart[],
            },
          ],
          model: args.model,
          temperature: args.temperature,
        });
        return {
          result: response.choices[0].message.content,
          citations: (response as any).citations,
        };
      },
    });
    athena.registerTool({
      name: "llm/generate-image",
      desc: "Generate an image with an image generation model.",
      args: {
        prompt: {
          type: "string",
          desc: "The prompt to use for the image generation.",
          required: true,
        },
        model: {
          type: "string",
          desc: `The model to use. Available models: ${JSON.stringify(
            this.config.models.image
          )}`,
          required: true,
        },
      },
      retvals: {
        urls: {
          type: "array",
          desc: "The URLs of the generated images.",
          required: true,
          of: {
            type: "string",
            desc: "The URL of the generated image.",
            required: true,
          },
        },
      },
      fn: async (args: any) => {
        const response = await this.openai.images.generate({
          prompt: args.prompt,
          model: args.model,
        });
        return {
          urls: response.data.map((image) => image.url),
        };
      },
    });
  }

  async unload(athena: Athena) {
    athena.deregisterTool("llm/chat");
    athena.deregisterTool("llm/generate-image");
  }
}

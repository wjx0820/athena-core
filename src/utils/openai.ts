import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions.js";

export class OpenAIClient {
  client: OpenAI;

  constructor(baseUrl: string, apiKey: string) {
    this.client = new OpenAI({
      baseURL: baseUrl,
      apiKey: apiKey,
    });
  }

  async chatCompletion(
    messages: Array<ChatCompletionMessageParam>,
    model: string,
    temperature: number | null
  ) {
    return await this.client.chat.completions.create({
      messages: messages,
      model: model,
      temperature: temperature,
    });
  }

  async generateImage(
    prompt: string,
    model: string,
  ) {
    return await this.client.images.generate({
      prompt: prompt,
      model: model,
    });
  }
}

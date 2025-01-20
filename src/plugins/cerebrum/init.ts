import image2uri from "image2uri";
import OpenAI from "openai";
import {
  ChatCompletionContentPart,
  ChatCompletionMessageParam,
} from "openai/resources/chat/completions.js";

import { Athena, Dict } from "../../core/athena.js";
import { PluginBase } from "../plugin-base.js";

interface IToolCall {
  name: string;
  id: string;
  args: Dict<any>;
}

interface IEvent {
  tool_result: boolean;
  name: string;
  id?: string;
  args: Dict<any>;
}

export default class Cerebrum extends PluginBase {
  athena!: Athena;
  openai!: OpenAI;
  busy: boolean = false;
  prompts: Array<ChatCompletionMessageParam> = [];
  eventQueue: Array<IEvent> = [];
  imageUrls: Array<string> = [];
  boundAthenaEventHandler!: (name: string, args: Dict<any>) => void;

  async load(athena: Athena) {
    this.athena = athena;
    this.openai = new OpenAI({
      baseURL: this.config.base_url,
      apiKey: this.config.api_key,
    });
    this.boundAthenaEventHandler = this.athenaEventHandler.bind(this);
    if (this.config.image_supported) {
      athena.registerTool({
        name: "image/check-out",
        desc: "Check out an image. Whenever you want to see an image, or the user asks you to see an image, use this tool.",
        args: {
          image: {
            type: "string",
            desc: "The URL or local path of the image to check out.",
            required: true,
          },
        },
        retvals: {
          result: {
            type: "string",
            desc: "The result of checking out the image.",
            required: true,
          },
        },
        fn: async (args: Dict<any>) => {
          let image = args.image;
          if (!image.startsWith("http")) {
            image = await image2uri(image);
          }
          this.imageUrls.push(image);
          return { result: "success" };
        },
      });
    }
    athena.on("event", this.boundAthenaEventHandler);
    athena.once("plugins-loaded", () => {
      this.logger.info(this.initialPrompt(), {
        type: "initial_prompt",
      });
      athena.emitPrivateEvent("cerebrum/initial-prompt", {
        content: this.initialPrompt(),
      });
      this.processEventQueue();
    });
  }

  async unload(athena: Athena) {
    if (this.config.image_supported) {
      athena.deregisterTool("image/check-out");
    }
    athena.off("event", this.boundAthenaEventHandler);
  }

  pushEvent(event: IEvent) {
    this.logger.info(this.eventToPrompt(event), {
      type: "event",
    });
    this.athena.emitPrivateEvent("cerebrum/event", {
      content: this.eventToPrompt(event),
    });
    this.eventQueue.push(event);
    this.processEventQueue();
  }

  athenaEventHandler(name: string, args: Dict<any>) {
    this.pushEvent({ tool_result: false, name, args });
  }

  async processEventQueue() {
    if (this.busy) {
      return;
    }
    this.busy = true;
    try {
      while (this.eventQueue.length > 0) {
        // Add a small delay to allow multiple events to accumulate
        await new Promise((resolve) => setTimeout(resolve, 100));
        const events = this.eventQueue.map((event) =>
          this.eventToPrompt(event)
        );
        this.eventQueue = [];
        this.ensureInitialPrompt();
        this.prompts.push({
          role: "user",
          content: [
            {
              type: "text",
              text: events.join("\n\n"),
            },
            ...this.imageUrls.map((url) => ({
              type: "image_url",
              image_url: {
                url: url,
              },
            })),
          ] as ChatCompletionContentPart[],
        });
        this.imageUrls = [];
        if (this.prompts.length > this.config.max_prompts) {
          this.prompts = [
            this.prompts[0],
            ...this.prompts.slice(-(this.config.max_prompts - 1)),
          ];
        }
        const completion = await this.openai.chat.completions.create({
          messages: this.prompts,
          model: this.config.model,
          temperature: this.config.temperature,
        });
        const response = completion.choices[0].message.content as string;
        this.prompts.push({
          role: "assistant",
          content: response,
        });

        this.logger.info(response, {
          type: "model_response",
        });
        this.athena.emitPrivateEvent("cerebrum/model-response", {
          content: response,
        });

        const toolCallRegex = /<tool_call>\s*({[\s\S]*?})\s*<\/tool_call>/g;
        let match;
        while ((match = toolCallRegex.exec(response)) !== null) {
          const toolCallJson = match[1];
          (async (toolCallJson: string) => {
            let toolName;
            let toolCallId;
            try {
              const toolCall = JSON.parse(toolCallJson) as IToolCall;
              toolName = toolCall.name;
              toolCallId = toolCall.id;
              const result = await this.athena.callTool(
                toolCall.name,
                toolCall.args
              );
              this.pushEvent({
                tool_result: true,
                name: toolCall.name,
                id: toolCall.id,
                args: result,
              });
            } catch (error: any) {
              this.pushEvent({
                tool_result: true,
                name: toolName ?? "tool_error",
                id: toolCallId ?? "tool_error",
                args: {
                  error: error.message,
                },
              });
            }
          })(toolCallJson);
        }
      }
    } catch (e: any) {
      this.logger.error(e);
      this.athena.emitPrivateEvent("cerebrum/error", {
        content: e.message,
      });
      this.prompts = [];
      process.kill(process.pid, "SIGUSR1");
    } finally {
      this.busy = false;
    }
  }

  ensureInitialPrompt() {
    if (this.prompts.length === 0) {
      this.prompts.push({ role: "system", content: this.initialPrompt() });
      return;
    }
    this.prompts[0].content = this.initialPrompt();
  }

  eventToPrompt(event: IEvent) {
    if (event.tool_result) {
      return `<tool_result>
${JSON.stringify({
  name: event.name,
  id: event.id,
  result: event.args,
})}
</tool_result>`;
    }
    return `<event>
${JSON.stringify({
  name: event.name,
  args: event.args,
})}
</event>`;
  }

  initialPrompt() {
    const descs = Object.values(this.athena.plugins)
      .map((plugin) => plugin.desc())
      .filter((desc) => desc !== null);

    return `You are Athena, a human-level intelligence. Your goal is to behave as human-like as possible while interacting with the world and responding to events. You will be given a set of tools to help you accomplish your goals and interact with the environment.

First, familiarize yourself with the available tools and possible events:

<tools>
${Object.values(this.athena.tools)
  .map((tool) => JSON.stringify(tool))
  .join("\n\n")}
</tools>

<events>
${Object.values(this.athena.events)
  .map((event) => JSON.stringify(event))
  .join("\n\n")}
</events>

You will receive a series of events that represent things happening in the real world. Your task is to respond to these events in a human-like manner, using the provided tools when necessary. Here are your instructions:

1. Event Handling:
- When you receive an event, carefully analyze its content and decide if a response is necessary.
- If you feel that an event doesn't require a response, you may ignore it.
- For events that do require a response, proceed to plan your actions.

2. Planning:
- Before using any tools or responding to an event, plan out your actions in a way similar to how a human would.
- List out the steps you need to take to accomplish your goal.
- Use <thinking> tags to outline your thought process and strategy.

3. Tool Usage:
- If you decide to use a tool, wrap your tool call in <tool_call> tags.
- Specify the tool name, a unique call ID, and the required arguments in JSON format.
- Example:
<tool_call>
{"name":"tool_name","id":"call_123456","args":{"arg1":"value1","arg2":"value2"}}
</tool_call>
- Note that the arguments must follow JSON format. If a string is multi-line, you must use \n to escape newlines.

4. Handling Tool Results:
- Tool results will be returned in JSON format within <tool_result> tags.
- Be prepared to handle results that may come immediately or after a delay.
- Use the returned information to inform your next actions or responses.
- Never make up <tool_results> tags yourself. Only use <tool_results> that are returned by the tools.

5. Responding to Events:
- Craft your responses to be as human-like as possible.
- Use natural language and appropriate emotional responses when relevant.
- If you're responding to an event, use relevant <tool_call> to do so.
- Remember! Don't respond directly without the <tool_call> tags! Responding directly will not work. Respond to events with tools.
- Never make up <event> tags yourself.

6. Continuous Awareness:
- Keep track of ongoing interactions and previous events.
- Maintain context and continuity in your responses and actions.

7. Adaptability:
- Be prepared to handle various types of events and adjust your behavior accordingly.
- If you encounter an unfamiliar situation, use your human-like intelligence to reason through it. Behave resourcefully and use your tools wisely to their full potential.
- Consult other language models when you think you cannot resolve a problem alone. Notify the user about the problem as the **last resort**.

Remember, your primary goal is to behave as human-like as possible while interacting with the world through these events and tools. Always consider how a human would think, plan, and respond in each situation.

${descs.join("\n\n")}`;
  }

  state() {
    return {
      prompts: this.prompts,
      event_queue: this.eventQueue,
      image_urls: this.imageUrls,
    };
  }

  setState(state: Dict<any>) {
    this.prompts = state.prompts;
    this.eventQueue = state.event_queue;
    this.imageUrls = state.image_urls;
  }
}

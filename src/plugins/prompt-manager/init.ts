import { ChatCompletionMessageParam } from "openai/resources/chat/completions.js";

import { Athena, IAthenaEvent, IAthenaTool } from "../../core/athena.js";
import { PluginBase } from "../plugin-base.js";
import { OpenAIClient } from "../../utils/openai.js";

interface IToolCall {
  name: string;
  id: string;
  args: any;
}

interface IEvent {
  tool_result: boolean;
  name: string;
  id?: string;
  args: any;
}

export default class PromptManager extends PluginBase {
  athena!: Athena;
  openai!: OpenAIClient;
  busy: boolean;
  prompts: Array<ChatCompletionMessageParam>;
  eventQueue: Array<IEvent>;
  boundAthenaEventHandler: (name: string, args: any) => Promise<void>;

  constructor(config: any) {
    super(config);
    this.busy = false;
    this.prompts = [];
    this.eventQueue = [];
    this.boundAthenaEventHandler = this.athenaEventHandler.bind(this);
  }

  desc() {
    return null;
  }

  async load(athena: Athena) {
    this.athena = athena;
    this.openai = new OpenAIClient(
      this.config.openai.base_url,
      this.config.openai.api_key
    );
    this.athena.on("event", this.boundAthenaEventHandler);
  }

  async unload() {
    this.athena.off("event", this.boundAthenaEventHandler);
  }

  async athenaEventHandler(name: string, args: any) {
    this.eventQueue.push({ tool_result: false, name, args });
    this.processEventQueue();
  }

  async processEventQueue() {
    if (this.busy) {
      return;
    }
    this.busy = true;
    try {
      while (this.eventQueue.length > 0) {
        const events = this.eventQueue.map((event) =>
          this.eventToPrompt(event)
        );
        this.eventQueue = [];
        this.ensureInitialPrompt();
        this.prompts.push({ role: "user", content: events.join("\n\n") });
        const completion = await this.openai.chatCompletion(
          this.prompts,
          this.config.openai.model,
          this.config.openai.temperature
        );
        this.prompts.push(completion.choices[0].message);

        const response = completion.choices[0].message.content as string;
        const toolCallRegex = /<tool_call>\s*({[\s\S]*?})\s*<\/tool_call>/g;
        let match;
        while ((match = toolCallRegex.exec(response)) !== null) {
          const toolCallJson = match[1];
          (async (toolCallJson: string) => {
            try {
              const toolCall = JSON.parse(toolCallJson) as IToolCall;
              const result = await this.athena.callTool(
                toolCall.name,
                toolCall.args
              );
              this.eventQueue.push({
                tool_result: true,
                name: toolCall.name,
                id: toolCall.id,
                args: result,
              });
              this.processEventQueue();
            } catch (error: any) {
              this.eventQueue.push({
                tool_result: true,
                name: "tool_error",
                args: {
                  error: error.message,
                },
              });
              this.processEventQueue();
            }
          })(toolCallJson);
        }
      }
    } finally {
      this.busy = false;
    }
  }

  ensureInitialPrompt() {
    if (this.prompts.length === 0) {
      this.prompts.push({ role: "user", content: this.initialPrompt() });
      this.prompts.push({
        role: "assistant",
        content:
          "Certainly! I'm ready to help you. I'm currently waiting for events...",
      });
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
    const tools = Array.from(this.athena.tools.values()).map((tool) =>
      this.toolTypeToPrompt(tool)
    );
    const events = Array.from(this.athena.events.values()).map((event) =>
      this.eventTypeToPrompt(event)
    );
    const descs = Array.from(this.athena.plugins.values())
      .map((plugin) => plugin.desc())
      .filter((desc) => desc !== null);

    return `You are Athena, a friendly human-level intelligence AI assistant. Your goal is to behave as human-like as possible while interacting with the world and responding to events. You will be given a set of tools to help you accomplish your goals and interact with the environment.

First, familiarize yourself with the available tools and possible events:

<tools>
${tools.join("\n\n")}
</tools>

<events>
${events.join("\n\n")}
</events>

You will receive a series of events that represent things happening in the real world. Your task is to respond to these events in a human-like manner, using the provided tools when necessary. Here are your instructions:

1. Event Handling:
- When you receive an event, carefully analyze its content and decide if a response is necessary.
- If you feel that an event doesn't require a response, you may ignore it.
- For events that do require a response, proceed to plan your actions.

2. Planning:
- Before using any tools or responding to an event, plan out your actions in a way similar to how a human would.
- Use <thinking> tags to outline your thought process and strategy.

3. Tool Usage:
- If you decide to use a tool, wrap your tool call in <tool_call> tags.
- Specify the tool name, a unique call ID, and the required arguments in JSON format.
- Example:
<tool_call>
{
"name": "some_tool",
"id": "call_123456",
"args": {
"arg1": "value1",
"arg2": "value2"
}
}
</tool_call>

4. Handling Tool Results:
- Tool results will be returned in JSON format within <tool_result> tags.
- Be prepared to handle results that may come immediately or after a delay.
- Use the returned information to inform your next actions or responses.

5. Responding to Events:
- Craft your responses to be as human-like as possible.
- Use natural language and appropriate emotional responses when relevant.
- If you're responding to an event, use relevant <tool_call> to do so.

6. Continuous Awareness:
- Keep track of ongoing interactions and previous events.
- Maintain context and continuity in your responses and actions.

7. Adaptability:
- Be prepared to handle various types of events and adjust your behavior accordingly.
- If you encounter an unfamiliar situation, use your human-like intelligence to reason through it.

Remember, your primary goal is to behave as human-like as possible while interacting with the world through these events and tools. Always consider how a human would think, plan, and respond in each situation.

${descs.join("\n\n")}`;
  }

  toolTypeToPrompt(tool: IAthenaTool) {
    return `## ${tool.name}
${tool.desc}

### Arguments
${JSON.stringify(tool.args)}

### Return Values
${JSON.stringify(tool.retvals)}`;
  }

  eventTypeToPrompt(event: IAthenaEvent) {
    return `## ${event.name}
${event.desc}

### Arguments
${JSON.stringify(event.args)}`;
  }
}

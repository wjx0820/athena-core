export interface IWebappUIMessageMessageFile {
  name: string;
  location: string;
}

export interface IWebappUIMessageMessage {
  type: "message";
  data: {
    role: "assistant" | "user";
    content: string;
    files: IWebappUIMessageMessageFile[];
    timestamp: number;
  };
}

export interface IWebappUIMessageThinking {
  type: "thinking";
  data: {
    content: string;
    timestamp: number;
  };
}

export interface IWebappUIMessageToolCall {
  type: "tool_call";
  data: {
    summary: string;
    details: string;
    timestamp: number;
  };
}

export interface IWebappUIMessageToolResult {
  type: "tool_result";
  data: {
    summary: string;
    details: string;
    timestamp: number;
  };
}

export interface IWebappUIMessageEvent {
  type: "event";
  data: {
    summary: string;
    details: string;
    timestamp: number;
  };
}

export interface IWebappUIMessageBusy {
  type: "busy";
  data: {
    busy: boolean;
  };
}

export interface IWebappUIMessagePing {
  type: "ping";
  data: Record<string, never>;
}

export interface IWebappUIMessagePong {
  type: "pong";
  data: Record<string, never>;
}

export type IWebappUIMessage =
  | IWebappUIMessageMessage
  | IWebappUIMessageThinking
  | IWebappUIMessageToolCall
  | IWebappUIMessageToolResult
  | IWebappUIMessageEvent
  | IWebappUIMessageBusy
  | IWebappUIMessagePing
  | IWebappUIMessagePong;

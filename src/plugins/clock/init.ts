import { v4 as uuidv4 } from "uuid";

import { Athena } from "../../core/athena.js";
import { PluginBase } from "../plugin-base.js";

interface ITimeout {
  id: string;
  seconds: number;
  reason: string;
  recurring: boolean;
  timeout: NodeJS.Timeout;
}

export default class Clock extends PluginBase {
  athena!: Athena;
  timeouts: { [key: string]: ITimeout };

  constructor(config: { [key: string]: any }) {
    super(config);
    this.timeouts = {};
  }

  desc() {
    return `Current time is ${this.currentTime().toISOString()}.`;
  }

  async load(athena: Athena) {
    this.athena = athena;
    athena.registerEvent({
      name: "clock/timeout-triggered",
      desc: "This event is triggered when a timeout is reached.",
      args: {
        timeout_id: {
          type: "string",
          desc: "The id of the timeout that was reached.",
          required: true,
        },
        reason: {
          type: "string",
          desc: "The reason why the timeout was set.",
          required: true,
        },
        recurring: {
          type: "boolean",
          desc: "Whether the timeout is recurring.",
          required: true,
        },
        current_time: {
          type: "string",
          desc: "The current time in ISO 8601 format.",
          required: true,
        },
      },
    });
    athena.registerTool({
      name: "clock/set-timeout",
      desc: "Set a timeout.",
      args: {
        seconds: {
          type: "number",
          desc: "The number of seconds to wait before triggering the timeout.",
          required: true,
        },
        reason: {
          type: "string",
          desc: "The reason why the timeout was set.",
          required: true,
        },
        recurring: {
          type: "boolean",
          desc: "Whether the timeout is recurring.",
          required: true,
        },
      },
      retvals: {
        timeout_id: {
          type: "string",
          desc: "The id of the timeout that was set.",
          required: true,
        },
      },
      fn: async (args: { [key: string]: any }) => {
        const id = uuidv4();
        let timeout: NodeJS.Timeout;
        if (args.recurring) {
          timeout = setInterval(() => {
            this.athena.emitEvent("clock/timeout-triggered", {
              timeout_id: id,
              reason: args.reason,
              recurring: args.recurring,
              current_time: this.currentTime().toISOString(),
            });
          }, args.seconds * 1000);
        } else {
          timeout = setTimeout(() => {
            this.athena.emitEvent("clock/timeout-triggered", {
              timeout_id: id,
              reason: args.reason,
              recurring: args.recurring,
              current_time: this.currentTime().toISOString(),
            });
            delete this.timeouts[id];
          }, args.seconds * 1000);
        }
        this.timeouts[id] = {
          id,
          seconds: args.seconds,
          reason: args.reason,
          recurring: args.recurring,
          timeout,
        };
        return { timeout_id: id };
      },
    });
    athena.registerTool({
      name: "clock/list-timeouts",
      desc: "List all timeouts.",
      args: {},
      retvals: {
        timeouts: {
          type: "array",
          desc: "The timeouts.",
          required: true,
          of: {
            type: "object",
            desc: "A timeout.",
            required: true,
            of: {
              id: {
                type: "string",
                desc: "The id of the timeout.",
                required: true,
              },
              seconds: {
                type: "number",
                desc: "The number of seconds to wait before triggering the timeout.",
                required: true,
              },
              reason: {
                type: "string",
                desc: "The reason why the timeout was set.",
                required: true,
              },
              recurring: {
                type: "boolean",
                desc: "Whether the timeout is recurring.",
                required: true,
              },
            },
          },
        },
      },
      fn: async () => {
        return {
          timeouts: Object.values(this.timeouts).map((timeout) => ({
            id: timeout.id,
            seconds: timeout.seconds,
            reason: timeout.reason,
            recurring: timeout.recurring,
          })),
        };
      },
    });
    athena.registerTool({
      name: "clock/clear-timeout",
      desc: "Clear a timeout.",
      args: {
        timeout_id: {
          type: "string",
          desc: "The id of the timeout to clear.",
          required: true,
        },
      },
      retvals: {
        status: {
          type: "string",
          desc: "The status of the operation.",
          required: true,
        },
      },
      fn: async (args: { [key: string]: any }) => {
        if (!this.timeouts[args.timeout_id]) {
          throw new Error(`Timeout with id ${args.timeout_id} not found.`);
        }
        clearTimeout(this.timeouts[args.timeout_id].timeout);
        delete this.timeouts[args.timeout_id];
        return { status: "success" };
      },
    });
    athena.registerTool({
      name: "clock/set-alarm",
      desc: "Set an alarm.",
      args: {
        time: {
          type: "string",
          desc: "The time to set the alarm in ISO 8601 format.",
          required: true,
        },
        reason: {
          type: "string",
          desc: "The reason why the alarm was set.",
          required: true,
        },
      },
      retvals: {
        timeout_id: {
          type: "string",
          desc: "The id of the timeout that was set.",
          required: true,
        },
      },
      fn: async (args: { [key: string]: any }) => {
        const id = uuidv4();
        const time = new Date(args.time);
        const now = this.currentTime();
        const seconds = Math.floor((time.getTime() - now.getTime()) / 1000);
        if (seconds < 0) {
          throw new Error("Alarm time must be in the future.");
        }
        const timeout = setTimeout(() => {
          this.athena.emitEvent("clock/timeout-triggered", {
            timeout_id: id,
            reason: args.reason,
            recurring: false,
            current_time: this.currentTime().toISOString(),
          });
          delete this.timeouts[id];
        }, seconds * 1000);
        this.timeouts[id] = {
          id,
          seconds,
          reason: args.reason,
          recurring: false,
          timeout,
        };
        return { timeout_id: id };
      },
    });
  }

  async unload() {
    this.athena.deregisterTool("clock/set-timeout");
    this.athena.deregisterTool("clock/list-timeouts");
    this.athena.deregisterTool("clock/clear-timeout");
    this.athena.deregisterTool("clock/set-alarm");
    this.athena.deregisterEvent("clock/timeout-triggered");
  }

  currentTime() {
    const date = new Date();
    date.setHours(date.getHours() + this.config.timezone);
    return date;
  }
}

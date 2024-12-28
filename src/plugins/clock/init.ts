import { v4 as uuidv4 } from "uuid";

import { Athena } from "../../core/athena.js";
import { PluginBase } from "../plugin-base.js";

interface ITimeout {
  id: string;
  start_time: Date;
  seconds: number;
  reason: string;
  recurring: boolean;
  timeout: NodeJS.Timeout;
}

export default class Clock extends PluginBase {
  timeouts: { [key: string]: ITimeout } = {};

  desc() {
    return `Current time is ${new Date().toString()}.`;
  }

  async load(athena: Athena) {
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
          desc: "The current time.",
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
            athena.emitEvent("clock/timeout-triggered", {
              timeout_id: id,
              reason: args.reason,
              recurring: args.recurring,
              current_time: new Date().toString(),
            });
          }, args.seconds * 1000);
        } else {
          timeout = setTimeout(() => {
            athena.emitEvent("clock/timeout-triggered", {
              timeout_id: id,
              reason: args.reason,
              recurring: args.recurring,
              current_time: new Date().toString(),
            });
            delete this.timeouts[id];
          }, args.seconds * 1000);
        }
        this.timeouts[id] = {
          id,
          start_time: new Date(),
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
              start_time: {
                type: "string",
                desc: "The start time of the timeout.",
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
            start_time: timeout.start_time.toString(),
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
          desc: "The date and time to set the alarm.",
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
        const now = new Date();
        const seconds = Math.floor((time.getTime() - now.getTime()) / 1000);
        if (seconds < 0) {
          throw new Error("Alarm time must be in the future.");
        }
        const timeout = setTimeout(() => {
          athena.emitEvent("clock/timeout-triggered", {
            timeout_id: id,
            reason: args.reason,
            recurring: false,
            current_time: new Date().toString(),
          });
          delete this.timeouts[id];
        }, seconds * 1000);
        this.timeouts[id] = {
          id,
          start_time: new Date(),
          seconds,
          reason: args.reason,
          recurring: false,
          timeout,
        };
        return { timeout_id: id };
      },
    });
  }

  async unload(athena: Athena) {
    for (const timeout of Object.values(this.timeouts)) {
      clearTimeout(timeout.timeout);
    }
    athena.deregisterTool("clock/set-timeout");
    athena.deregisterTool("clock/list-timeouts");
    athena.deregisterTool("clock/clear-timeout");
    athena.deregisterTool("clock/set-alarm");
    athena.deregisterEvent("clock/timeout-triggered");
  }
}

import { Athena } from "../../core/athena.js";
import { PluginBase } from "../plugin-base.js";

export default class Clock extends PluginBase {
  athena!: Athena;
  interval!: NodeJS.Timeout;

  desc() {
    return `Clock tick event is triggered every ${this.config.tick_every_seconds} seconds. When triggered, you can check whether you should do something based on the current time. You can also think about something else you are interested in.`;
  }

  async load(athena: Athena) {
    this.athena = athena;

    athena.registerEvent({
      name: "clock/tick",
      desc: "This event is triggered periodically.",
      args: {
        current_time: {
          type: "string",
          desc: "Current time in ISO 8601 format.",
          required: true,
        },
      },
    });

    athena.registerEvent({
      name: "clock/timer-expired",
      desc: "This event is triggered when the timer is up.",
      args: {
        seconds: {
          type: "number",
          desc: "Number of seconds the timer was set for.",
          required: true,
        },
        reason: {
          type: "string",
          desc: "Reason for setting the timer.",
          required: true,
        },
        current_time: {
          type: "string",
          desc: "Current time in ISO 8601 format.",
          required: true,
        },
      },
    });

    athena.registerTool({
      name: "clock/set-timer",
      desc: "This tool is used to set a timer.",
      args: {
        seconds: {
          type: "number",
          desc: "Number of seconds to set the timer for.",
          required: true,
        },
        reason: {
          type: "string",
          desc: "Reason for setting the timer.",
          required: true,
        },
      },
      retvals: {
        target_time: {
          type: "string",
          desc: "Target time in ISO 8601 format.",
          required: true,
        },
      },
      fn: async (args: { [key: string]: any }) => {
        setTimeout(() => {
          athena.emitEvent("clock/timer-expired", {
            seconds: args.seconds,
            reason: args.reason,
            current_time: new Date().toISOString(),
          });
        }, args.seconds * 1000);
        return {
          target_time: new Date(Date.now() + args.seconds * 1000).toISOString(),
        };
      },
    });

    athena.registerTool({
      name: "clock/get-current-time",
      desc: "This tool is used to get the current time.",
      args: {},
      retvals: {
        current_time: {
          type: "string",
          desc: "Current time in ISO 8601 format.",
          required: true,
        },
      },
      fn: async (args: { [key: string]: any }) => {
        return {
          current_time: new Date().toISOString(),
        };
      },
    });

    athena.on("plugins-loaded", () => {
      this.interval = setInterval(() => {
        athena.emitEvent("clock/tick", {
          current_time: new Date().toISOString(),
        });
      }, this.config.tick_every_seconds * 1000);
    });
  }

  async unload() {
    clearInterval(this.interval);
    this.athena.deregisterTool("clock/set-timer");
    this.athena.deregisterEvent("clock/timer-expired");
    this.athena.deregisterEvent("clock/tick");
  }
}

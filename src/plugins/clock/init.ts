import { Athena, Dict } from "../../core/athena.js";
import { PluginBase } from "../plugin-base.js";

interface ITimeout {
  reason: string;
  next_trigger_time: number;
  recurring: boolean;
  interval: number;
}

export default class Clock extends PluginBase {
  athena!: Athena;
  timeouts: ITimeout[] = [];
  timeout?: NodeJS.Timeout;

  desc() {
    return `The following timeouts are set: ${JSON.stringify(
      this.timeouts.map((t) => ({
        reason: t.reason,
        next_trigger_time: new Date(t.next_trigger_time).toString(),
        recurring: t.recurring,
        interval: t.interval / 1000,
      }))
    )}`;
  }

  async load(athena: Athena) {
    this.athena = athena;
    athena.registerEvent({
      name: "clock/timeout-triggered",
      desc: "This event is triggered when a timeout is reached.",
      args: {
        index: {
          type: "number",
          desc: "The index of the timeout in the list of timeouts.",
          required: true,
        },
        reason: {
          type: "string",
          desc: "The reason why the timeout was triggered.",
          required: true,
        },
        recurring: {
          type: "boolean",
          desc: "Whether the timeout is recurring.",
          required: true,
        },
        interval: {
          type: "number",
          desc: "The interval of the timeout.",
          required: true,
        },
      },
    });
    athena.registerTool({
      name: "clock/get-time",
      desc: "Get the current date and time.",
      args: {},
      retvals: {
        time: {
          type: "string",
          desc: "The current date and time.",
          required: true,
        },
      },
      fn: async () => {
        return { time: new Date().toString() };
      },
    });
    athena.registerTool({
      name: "clock/set-timer",
      desc: "Set a timer.",
      args: {
        seconds: {
          type: "number",
          desc: "The number of seconds to wait before triggering the timer.",
          required: false,
        },
        minutes: {
          type: "number",
          desc: "The number of minutes to wait before triggering the timer.",
          required: false,
        },
        hours: {
          type: "number",
          desc: "The number of hours to wait before triggering the timer.",
          required: false,
        },
        reason: {
          type: "string",
          desc: "The reason why the timer was set. Include as much detail as possible.",
          required: true,
        },
        recurring: {
          type: "boolean",
          desc: "Whether the timer is recurring.",
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
      fn: async (args: Dict<any>) => {
        const interval =
          (args.seconds || 0) * 1000 +
          (args.minutes || 0) * 60 * 1000 +
          (args.hours || 0) * 60 * 60 * 1000;
        this.timeouts.push({
          reason: args.reason,
          next_trigger_time: Date.now() + interval,
          recurring: args.recurring,
          interval,
        });
        this.updateTimeout();
        return { status: "success" };
      },
    });
    athena.registerTool({
      name: "clock/set-alarm",
      desc: "Set an alarm.",
      args: {
        time: {
          type: "string",
          desc: "The date and time to set the alarm for. Need to specify timezone.",
          required: true,
        },
        reason: {
          type: "string",
          desc: "The reason why the alarm was set. Include as much detail as possible.",
          required: true,
        },
        recurring: {
          type: "boolean",
          desc: "Whether the alarm is recurring.",
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
      fn: async (args: Dict<any>) => {
        const time = new Date(args.time);
        const now = new Date();
        if (time <= now) {
          throw new Error("Alarm time must be in the future.");
        }
        this.timeouts.push({
          reason: args.reason,
          next_trigger_time: time.getTime(),
          recurring: args.recurring,
          interval: 24 * 60 * 60 * 1000,
        });
        this.updateTimeout();
        return { status: "success" };
      },
    });
    athena.registerTool({
      name: "clock/clear-timeout",
      desc: "Clear a timeout.",
      args: {
        index: {
          type: "number",
          desc: "The index of the timeout to clear.",
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
      fn: async (args: Dict<any>) => {
        this.timeouts.splice(args.index, 1);
        this.updateTimeout();
        return { status: "success" };
      },
    });
  }

  async unload(athena: Athena) {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    athena.deregisterEvent("clock/timeout-triggered");
    athena.deregisterTool("clock/set-timer");
    athena.deregisterTool("clock/set-alarm");
    athena.deregisterTool("clock/clear-timeout");
  }

  state() {
    return {
      timeouts: this.timeouts,
    };
  }

  setState(state: Dict<any>) {
    this.timeouts = state.timeouts;
    const now = Date.now();
    this.timeouts = this.timeouts.filter((t) => {
      if (t.next_trigger_time > now) {
        return true;
      }
      if (t.recurring) {
        while (t.next_trigger_time <= now) {
          t.next_trigger_time += t.interval;
        }
        return true;
      }
      return false;
    });
    this.updateTimeout();
  }

  updateTimeout() {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    if (this.timeouts.length === 0) {
      return;
    }
    const closestNextTriggerTime = this.timeouts.reduce((min, t) => {
      return Math.min(min, t.next_trigger_time);
    }, Infinity);
    this.timeout = setTimeout(() => {
      const now = Date.now();
      const firedTimeouts = this.timeouts.filter(
        (t) => t.next_trigger_time <= now
      );
      for (const timeout of firedTimeouts) {
        this.athena.emitEvent("clock/timeout-triggered", {
          index: this.timeouts.indexOf(timeout),
          reason: timeout.reason,
          recurring: timeout.recurring,
          interval: timeout.interval,
        });
      }
      this.timeouts = this.timeouts.filter((t) => {
        if (t.next_trigger_time > now) {
          return true;
        }
        if (t.recurring) {
          while (t.next_trigger_time <= now) {
            t.next_trigger_time += t.interval;
          }
          return true;
        }
        return false;
      });
      this.updateTimeout();
    }, closestNextTriggerTime - Date.now());
  }
}

import { EventEmitter } from "events";

import { PluginBase } from "../plugins/plugin-base.js";

export interface IAthenaArgument {
  type: "string" | "number" | "boolean" | "object" | "array";
  desc: string;
  required: boolean;
  of?: { [key: string]: IAthenaArgument } | IAthenaArgument;
}

export interface IAthenaTool {
  name: string;
  desc: string;
  args: { [key: string]: IAthenaArgument };
  retvals: { [key: string]: IAthenaArgument };
  fn: (args: { [key: string]: any }) => Promise<{ [key: string]: any }>;
}

export interface IAthenaEvent {
  name: string;
  desc: string;
  args: { [key: string]: IAthenaArgument };
}

export class Athena extends EventEmitter {
  config: { [key: string]: any };
  states: { [key: string]: { [key: string]: any } };
  plugins: { [key: string]: PluginBase };
  tools: { [key: string]: IAthenaTool };
  events: { [key: string]: IAthenaEvent };

  constructor(config: { [key: string]: any }, states: { [key: string]: { [key: string]: any } }) {
    super();
    this.config = config;
    this.states = states;
    this.plugins = {};
    this.tools = {};
    this.events = {};
  }

  async loadPlugins() {
    const plugins = this.config.plugins;
    if (!plugins) {
      throw new Error("No plugins found in config");
    }
    for (const [name, args] of Object.entries(plugins)) {
      await this.loadPlugin(name, args as { [key: string]: any });
      console.log(`Plugin ${name} is loaded`);
    }
    this.emit("plugins-loaded");
  }

  async unloadPlugins() {
    const plugins = Object.keys(this.plugins);
    for (const name of plugins) {
      await this.unloadPlugin(name);
      console.log(`Plugin ${name} is unloaded`);
    }
  }

  async loadPlugin(name: string, args: { [key: string]: any }) {
    if (name in this.plugins) {
      throw new Error(`Plugin ${name} already loaded`);
    }
    const Plugin = (await import(`../plugins/${name}/init.js`)).default;
    const plugin = new Plugin(args) as PluginBase;
    this.plugins[name] = plugin;
    await plugin.load(this);
    const state = this.states[name];
    if (state) {
      plugin.setState(state);
    }
  }

  async unloadPlugin(name: string) {
    if (!(name in this.plugins)) {
      throw new Error(`Plugin ${name} not loaded`);
    }
    const state = this.plugins[name].state();
    if (state) {
      this.states[name] = state;
    }
    await this.plugins[name].unload(this);
    delete this.plugins[name];
  }

  registerTool(tool: IAthenaTool) {
    if (tool.name in this.tools) {
      throw new Error(`Tool ${tool.name} already registered`);
    }
    this.tools[tool.name] = tool;
  }

  deregisterTool(name: string) {
    if (!(name in this.tools)) {
      throw new Error(`Tool ${name} not registered`);
    }
    delete this.tools[name];
  }

  registerEvent(event: IAthenaEvent) {
    if (event.name in this.events) {
      throw new Error(`Event ${event.name} already registered`);
    }
    this.events[event.name] = event;
  }

  deregisterEvent(name: string) {
    if (!(name in this.events)) {
      throw new Error(`Event ${name} not registered`);
    }
    delete this.events[name];
  }

  async callTool(name: string, args: { [key: string]: any }) {
    if (!(name in this.tools)) {
      throw new Error(`Tool ${name} not registered`);
    }
    return await this.tools[name].fn(args);
  }

  emitEvent(name: string, args: { [key: string]: any }) {
    if (!(name in this.events)) {
      throw new Error(`Event ${name} not registered`);
    }
    this.emit("event", name, args);
  }
}

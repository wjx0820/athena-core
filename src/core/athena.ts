import { EventEmitter } from "events";

import { PluginBase } from "../plugins/plugin-base.js";
import logger from "../utils/logger.js";

export type Dict<T> = { [key: string]: T };

export interface IAthenaArgument {
  type: "string" | "number" | "boolean" | "object" | "array";
  desc: string;
  required: boolean;
  of?: Dict<IAthenaArgument> | IAthenaArgument;
}

export interface IAthenaTool {
  name: string;
  desc: string;
  args: Dict<IAthenaArgument>;
  retvals: Dict<IAthenaArgument>;
  fn: (args: Dict<any>) => Promise<Dict<any>>;
}

export interface IAthenaEvent {
  name: string;
  desc: string;
  args: Dict<IAthenaArgument>;
}

export class Athena extends EventEmitter {
  config: Dict<any>;
  states: Dict<Dict<any>>;
  plugins: Dict<PluginBase>;
  tools: Dict<IAthenaTool>;
  events: Dict<IAthenaEvent>;

  constructor(config: Dict<any>, states: Dict<Dict<any>>) {
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
      await this.loadPlugin(name, args as Dict<any>);
    }
    this.emit("plugins-loaded");
  }

  async unloadPlugins() {
    const plugins = Object.keys(this.plugins);
    for (const name of plugins) {
      await this.unloadPlugin(name);
    }
  }

  async loadPlugin(name: string, args: Dict<any>) {
    if (name in this.plugins) {
      throw new Error(`Plugin ${name} already loaded`);
    }
    const Plugin = (await import(`../plugins/${name}/init.js`)).default;
    const plugin = new Plugin(args) as PluginBase;
    plugin.logger = logger.child({
      plugin: name,
    });
    this.plugins[name] = plugin;
    await plugin.load(this);
    const state = this.states[name];
    if (state) {
      plugin.setState(state);
    }
    logger.warn(`Plugin ${name} is loaded`);
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
    logger.warn(`Plugin ${name} is unloaded`);
  }

  registerTool(tool: IAthenaTool) {
    if (tool.name in this.tools) {
      throw new Error(`Tool ${tool.name} already registered`);
    }
    this.tools[tool.name] = tool;
    logger.warn(`Tool ${tool.name} is registered`);
  }

  deregisterTool(name: string) {
    if (!(name in this.tools)) {
      throw new Error(`Tool ${name} not registered`);
    }
    delete this.tools[name];
    logger.warn(`Tool ${name} is deregistered`);
  }

  registerEvent(event: IAthenaEvent) {
    if (event.name in this.events) {
      throw new Error(`Event ${event.name} already registered`);
    }
    this.events[event.name] = event;
    logger.warn(`Event ${event.name} is registered`);
  }

  deregisterEvent(name: string) {
    if (!(name in this.events)) {
      throw new Error(`Event ${name} not registered`);
    }
    delete this.events[name];
    logger.warn(`Event ${name} is deregistered`);
  }

  async callTool(name: string, args: Dict<any>) {
    if (!(name in this.tools)) {
      throw new Error(`Tool ${name} not registered`);
    }
    return await this.tools[name].fn(args);
  }

  emitEvent(name: string, args: Dict<any>) {
    if (!(name in this.events)) {
      throw new Error(`Event ${name} not registered`);
    }
    this.emit("event", name, args);
  }
}

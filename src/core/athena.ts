import { EventEmitter } from "events";

import { PluginBase } from "../plugins/plugin-base.js";

export interface IAthenaArgument {
  desc: string;
  type: "string" | "number" | "boolean" | "object" | "array";
  required: boolean;
  of?: Map<string, IAthenaArgument> | IAthenaArgument;
}

export interface IAthenaTool {
  name: string;
  desc: string;
  args: Map<string, IAthenaArgument>;
  retvals: Map<string, IAthenaArgument>;
  fn: (args: any) => Promise<any>;
}

export interface IAthenaEvent {
  name: string;
  desc: string;
  args: Map<string, IAthenaArgument>;
}

export class Athena extends EventEmitter {
  config: any;
  plugins: Map<string, PluginBase>;
  tools: Map<string, IAthenaTool>;
  events: Map<string, IAthenaEvent>;

  constructor(config: any) {
    super();
    this.config = config;
    this.plugins = new Map();
    this.tools = new Map();
    this.events = new Map();
  }

  async loadPlugins() {
    const plugins = this.config.plugins;
    if (!plugins) {
      throw new Error("No plugins found in config");
    }
    for (const [name, args] of Object.entries(plugins)) {
      await this.loadPlugin(name, args);
      console.log(`Plugin ${name} is loaded`);
    }
  }

  async loadPlugin(name: string, args: any) {
    if (this.plugins.has(name)) {
      throw new Error(`Plugin ${name} already loaded`);
    }
    const Plugin = (await import(`../plugins/${name}/init.js`)).default;
    const plugin = new Plugin(args) as PluginBase;
    this.plugins.set(name, plugin);
    await plugin.load(this);
  }

  async unloadPlugin(name: string) {
    if (!this.plugins.has(name)) {
      throw new Error(`Plugin ${name} not loaded`);
    }
    await this.plugins.get(name)!.unload();
    this.plugins.delete(name);
  }

  registerTool(tool: IAthenaTool) {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool ${tool.name} already registered`);
    }
    this.tools.set(tool.name, tool);
  }

  deregisterTool(name: string) {
    if (!this.tools.has(name)) {
      throw new Error(`Tool ${name} not registered`);
    }
    this.tools.delete(name);
  }

  registerEvent(event: IAthenaEvent) {
    if (this.events.has(event.name)) {
      throw new Error(`Event ${event.name} already registered`);
    }
    this.events.set(event.name, event);
  }

  deregisterEvent(name: string) {
    if (!this.events.has(name)) {
      throw new Error(`Event ${name} not registered`);
    }
    this.events.delete(name);
  }

  async callTool(name: string, args: any) {
    if (!this.tools.has(name)) {
      throw new Error(`Tool ${name} not registered`);
    }
    return await this.tools.get(name)!.fn(args);
  }

  emitEvent(name: string, args: any) {
    if (!this.events.has(name)) {
      throw new Error(`Event ${name} not registered`);
    }
    this.emit("event", name, args);
  }
}

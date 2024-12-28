import { Athena } from "../core/athena.js";

export abstract class PluginBase {
  config: { [key: string]: any };

  constructor(config: { [key: string]: any }) {
    this.config = config;
  }

  desc(): string | null {
    return null;
  }

  async load(athena: Athena): Promise<void> { }

  async unload(athena: Athena): Promise<void> { }

  state(): { [key: string]: any } | null {
    return null;
  }

  setState(state: { [key: string]: any }): void { }
}

import { Athena } from "../core/athena.js";

export abstract class PluginBase {
  config: { [key: string]: any };

  constructor(config: { [key: string]: any }) {
    this.config = config;
  }

  abstract desc(): string | null;
  abstract load(athena: Athena): Promise<void>;
  abstract unload(): Promise<void>;
}

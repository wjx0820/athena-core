import { Logger } from "winston";

import { Athena, Dict } from "../core/athena.js";

export abstract class PluginBase {
  config: Dict<any>;
  logger!: Logger;

  constructor(config: Dict<any>) {
    this.config = config;
  }

  desc(): string | null {
    return null;
  }

  async load(athena: Athena): Promise<void> {}

  async unload(athena: Athena): Promise<void> {}

  state(): Dict<any> | null {
    return null;
  }

  setState(state: Dict<any>): void {}
}

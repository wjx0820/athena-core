import { Athena } from "../../core/athena.js";
import { PluginBase } from "../plugin-base.js";

export default class PromptManager extends PluginBase {
  desc() {
    return null;
  }

  async load(athena: Athena) {}

  async unload() {}
}

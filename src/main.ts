import fs from "fs/promises";

import yaml from "yaml";

import { Athena } from "./core/athena.js";

const main = async () => {
  if (process.argv.length !== 3) {
    console.error(`usage: ${process.argv[0]} ${process.argv[1]} <config-file>`);
    process.exit(1);
  }

  const configFile = process.argv[2];
  const config = yaml.parse(await fs.readFile(configFile, "utf8"));

  const statesFile = `${configFile}.states.yaml`;
  let states = {};
  try {
    states = yaml.parse(await fs.readFile(statesFile, "utf8"));
  } catch (e) { }

  const athena = new Athena(config, states);
  await athena.loadPlugins();

  process.on("SIGINT", async () => {
    await athena.unloadPlugins();
    await fs.writeFile(statesFile, yaml.stringify(athena.states));
    console.log("Athena is unloaded");
    process.exit(0);
  });

  console.log("Athena is loaded");
};

main();

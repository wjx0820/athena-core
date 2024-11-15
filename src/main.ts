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

  const athena = new Athena(config);
  await athena.loadPlugins();
  console.log("Athena is loaded");
};

main();

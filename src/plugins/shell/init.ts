import { exec } from "child_process";

import { Athena } from "../../core/athena.js";
import { PluginBase } from "../plugin-base.js";

export default class Shell extends PluginBase {
  async load(athena: Athena) {
    athena.registerTool({
      name: "shell/exec",
      desc: "Executes a shell command. Whenever you need to run a shell command, or the user's request requires running a shell command, use this tool.",
      args: {
        command: {
          type: "string",
          desc: "Shell command",
          required: true
        },
      },
      retvals: {
        stdout: {
          type: "string",
          desc: "Standard output of the command",
          required: true
        },
      },
      fn: (args: { [key: string]: any }) => {
        return new Promise((resolve, reject) => {
          exec(args.command, (error, stdout, stderr) => {
            if (error) {
              reject(Error(stderr));
            } else {
              resolve({ stdout });
            }
          });
        });
      },
    });
    athena.registerTool({
      name: "shell/apt-install",
      desc: "Installs a package using apt. Whenever you need to install a package using apt, or the user's request requires installing a package using apt, use this tool.",
      args: {
        package: {
          type: "string",
          desc: "Package name",
          required: true
        },
      },
      retvals: {
        result: {
          desc: "Result of the installation",
          required: true,
          type: "string",
        },
      },
      fn: (args: { [key: string]: any }) => {
        return new Promise((resolve, reject) => {
          exec(`apt install ${args.package} -y`, (error, stdout, stderr) => {
            if (error) {
              reject(Error(stderr));
            } else {
              resolve({ result: "success" });
            }
          });
        });
      },
    });
  }

  async unload(athena: Athena) {
    athena.deregisterTool("shell/exec");
    athena.deregisterTool("shell/apt-install");
  }
}

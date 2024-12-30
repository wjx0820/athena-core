import fs from 'fs';
import https from 'https';

import { convert } from 'html-to-text';

import { Athena } from "../../core/athena.js";
import { PluginBase } from "../plugin-base.js";

export default class Http extends PluginBase {
  async load(athena: Athena) {
    athena.registerTool({
      name: "http/fetch",
      desc: "Fetches an HTTP/HTTPS URL.",
      args: {
        url: {
          type: "string",
          desc: "The URL to fetch.",
          required: true,
        },
      },
      retvals: {
        result: {
          type: "string",
          desc: "The result of the fetch.",
          required: true,
        },
      },
      fn: async (args: { [key: string]: any }) => {
        const response = await fetch(args.url);
        return { result: convert(await response.text()) };
      },
    });
    athena.registerTool({
      name: "http/download-file",
      desc: "Downloads a file from an HTTP/HTTPS URL.",
      args: {
        url: {
          type: "string",
          desc: "The URL to download the file from.",
          required: true,
        },
        filename: {
          type: "string",
          desc: "The filename to save the file as.",
          required: true,
        },
      },
      retvals: {
        result: {
          type: "string",
          desc: "The result of the download.",
          required: true,
        },
      },
      fn: (args: { [key: string]: any }) => {
        return new Promise((resolve, reject) => {
          const file = fs.createWriteStream(args.filename);
          https.get(args.url, (response) => {
            if (response.statusCode !== 200) {
              reject(Error(`Failed to download file: ${response.statusCode}`));
              return;
            }
            response.pipe(file);
            file.on("finish", () => {
              file.close();
              resolve({ result: "success" });
            }).on("error", (err) => {
              fs.unlink(args.filename, () => {
                reject(err);
              });
            });
          });
        });
      },
    });
  }

  async unload(athena: Athena) {
    athena.deregisterTool("http/fetch");
    athena.deregisterTool("http/download-file");
  }
}

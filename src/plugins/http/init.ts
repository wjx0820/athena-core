import fs from 'fs';

import follow_redirects from 'follow-redirects';
const { https } = follow_redirects;
import { convert } from 'html-to-text';

import { Athena } from "../../core/athena.js";
import { PluginBase } from "../plugin-base.js";

export default class Http extends PluginBase {
  readonly headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
  };

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
        const response = await fetch(args.url, {
          headers: this.headers,
          redirect: 'follow',
        });
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
          https.get(args.url, {
            headers: this.headers,
          }, (response) => {
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

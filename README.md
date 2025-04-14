<p align="center">
  <img src="https://athenalab.ai/assets/favicon/favicon.svg" alt="Athena" width="150">
</p>

<h1 align="center">Athena</h1>
<h3 align="center">A fully autonomous AI agent 🤖</h3>

<div align="center">
<a href="https://discord.gg/X38GnhdTH8"><img src="https://img.shields.io/discord/1322861553137090560" alt="Discord"></a>
<a href="https://x.com/AthenaAGI"><img src="https://img.shields.io/twitter/follow/AthenaAGI" alt="X (formerly Twitter) Follow"></a>
<a href="https://athenalab.ai/"><img src="https://img.shields.io/badge/Website-AthenaLab.AI-blue" alt="Website"></a>
</div>

Athena is a production-grade AI agent that can help you solve complex tasks.

Try Athena in your browser: [https://athenalab.ai/](https://athenalab.ai/)

Join our [Discord community](https://discord.gg/X38GnhdTH8) to get help and support, and see what others are building with Athena.

## Quick Start

Clone the repository:

```bash
git clone https://github.com/Athena-AI-Lab/athena-core.git
```

Install pnpm if you don't have it already:

```bash
npm install -g pnpm
```

Install dependencies:

```bash
cd athena-core
pnpm i
pnpx playwright install
```

Configure the agent:

```bash
cp configs/config.yaml-example configs/config.yaml
```

A minimally working config file looks like this:

```yaml
quiet: true

plugins:
  cerebrum:
    base_url: https://api.openai.com/v1
    api_key: sk-proj-your-openai-api-key
    model: gpt-4o
    temperature: 0.5
    image_supported: true
    max_prompts: 50
    max_event_strlen: 65536
    max_tokens: 16384
  clock:
  http:
  short-term-memory:
  file-system:
  python:
  shell:
  browser:
    headless: false
  cli-ui:
```

Remember to enter your own API keys in the config file.

Start the agent:

```bash
pnpm start
```

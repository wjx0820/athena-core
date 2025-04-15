<p align="center">
  <img src="https://athenalab.ai/assets/favicon/favicon.svg" alt="Athena" width="150">
</p>

<h1 align="center">Athena</h1>
<h3 align="center">Your Autonomous AI Assistant ✨</h3>

<div align="center">
  <a href="https://discord.gg/X38GnhdTH8"><img src="https://img.shields.io/discord/1322861553137090560" alt="Discord"></a>
  <a href="https://x.com/AthenaAGI"><img src="https://img.shields.io/twitter/follow/AthenaAGI" alt="X (formerly Twitter) Follow"></a>
  <a href="https://athenalab.ai/"><img src="https://img.shields.io/badge/Website-AthenaLab.AI-blue" alt="Website"></a>
</div>

Athena is a production-ready AI agent designed to assist with complex tasks. It offers comprehensive capabilities including:

- 🖥️ Computer control through command line
- 📂 File system access
- 🐍 Python code execution
- 🌐 Web browser automation
- 🔍 Web search via [Jina](docs/configuration.md#http)
- ⏰ Time awareness and scheduling
- ✨ Chatting with other language models
- 🧠 Short-term memory for context retention
- 🤖 Bot functionality for [Telegram](docs/configuration.md#telegram) and [Discord](docs/configuration.md#discord)

Explore demos and experience Athena directly in your browser: [https://athenalab.ai/](https://athenalab.ai/).

Join our community: [Discord](https://discord.gg/X38GnhdTH8) | [X](https://x.com/AthenaAGI)

## 🚀 Quick Start

1. Clone the repository:
```bash
git clone https://github.com/Athena-AI-Lab/athena-core.git
```

2. Install pnpm (if not already installed):
```bash
npm install -g pnpm
```

3. Install project dependencies:
```bash
cd athena-core
pnpm i
pnpx playwright install
```

4. Copy the example config file:
```bash
cp configs/config.yaml-example configs/config.yaml
```

5. Edit `configs/config.yaml` with your API key. Here's a minimal working configuration:

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

For additional plugins and detailed configuration options, refer to the [Configuration Guide](docs/configuration.md).

6. Launch Athena:
```bash
pnpm start
```

7. Now you can talk to Athena in your terminal!

## 📄 License

This project is licensed under the BSD 3-Clause License. See the [LICENSE](LICENSE) file for details.

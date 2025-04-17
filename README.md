<p align="center">
  <img src="https://athenalab.ai/assets/favicon/favicon.svg" alt="Athena" width="150">
</p>

<h1 align="center">Athena</h1>
<h3 align="center">A General-Purpose AI Agent ✨</h3>

<div align="center">
  <a href="https://discord.gg/X38GnhdTH8"><img src="https://img.shields.io/discord/1322861553137090560" alt="Discord"></a>
  <a href="https://x.com/AthenaAGI"><img src="https://img.shields.io/twitter/follow/AthenaAGI" alt="X (formerly Twitter) Follow"></a>
  <a href="https://athenalab.ai/"><img src="https://img.shields.io/badge/Website-AthenaLab.AI-blue" alt="Website"></a>
</div>

**Athena** is a production-ready general AI agent built to *do*, not just *think*. It bridges insight with execution, helping you move from idea to reality effortlessly.

Some examples of what Athena can do:

- "🧠 Train a digit recognition model on the MNIST dataset using PyTorch"
- "🕹️ Launch a local Flask app and expose it using localtunnel"
- "📥 Find the top 3 most-starred Python repositories on GitHub this week and summarize what each does"
- "🔎 Search Hacker News for posts about 'LangChain' and summarize the top 3 discussions"
- "📊 Plot the MACD and RSI for TSLA over the last week"
- "🌐 Go to TechCrunch and extract the latest 5 tech news headlines"
- "📚 Scrape the top 10 books from the New York Times Best Sellers list and generate a reading list"
- "🗺️ Get the current weather in Tokyo and tell me the best time to visit this week"
- "📁 Find all PDF files in the Downloads folder and move them to Documents/Reading"
- "💬 Translate this Word document from Spanish to English and preserve formatting"

Explore demos and experience Athena directly in your browser: [https://athenalab.ai/](https://athenalab.ai/).

Join our community: [Discord](https://discord.gg/X38GnhdTH8) | [X](https://x.com/AthenaAGI)

## ✨ Features

With all the tools it has, Athena is capable of:

- 🖥️ Computer control through command line
- 📂 Accessing files and folders
- 🐍 Python code execution
- 🌐 Web browser automation
- 🔍 Web search via [Jina](docs/configuration.md#http)
- ⏰ Time awareness and scheduling
- ✨ Chatting with other language models
- 🧠 Short-term memory for context retention
- 🤖 Bot functionality for [Telegram](docs/configuration.md#telegram) and [Discord](docs/configuration.md#discord)

## 🚀 Quick Start

1. Clone the repository:
```bash
git clone https://github.com/Athena-AI-Lab/athena-core.git
```

2. [Install pnpm](https://pnpm.io/installation) (if not already installed):
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

> **Note:** This is a minimal working configuration. Advanced features such as Jina web search, multiple language model support, Telegram and Discord integration are not included here, though some may be essential for production use and require additional API keys.
>
> For a complete list of plugins and detailed configuration options, please refer to the [Configuration Guide](docs/configuration.md).

6. Launch Athena:
```bash
pnpm start
```

7. Now you can talk to Athena in your terminal!

## 📄 License

This project is licensed under the BSD 3-Clause License. See the [LICENSE](LICENSE) file for details.

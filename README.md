<div align="center">

# @brightdata/ai-sdk

### 让你的 AI 智能体看见网络。

由 [Bright Data](https://www.bright.cn/) 提供支持的即插即用 [Vercel AI SDK](https://sdk.vercel.ai) 工具：可抓取任何网站、搜索任意搜索引擎，并从 Amazon、LinkedIn、Instagram、Facebook 等平台采集结构化数据。

[![npm 版本](https://img.shields.io/npm/v/@brightdata/ai-sdk.svg)](https://www.npmjs.com/package/@brightdata/ai-sdk) [![许可证：MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

</div>

---

## 为什么选择它？

LLM 拥有强大的推理能力，但无法访问实时网络。此软件包弥合了这一差距：每个导出项都是一个现成的 `tool()`，任何兼容 AI SDK 的模型都能自主调用：

- **抓取**：获取任意网页并转换为干净的 Markdown，同时绕过反爬虫保护
- **搜索**：查询 Google、Bing 或 Yandex，并获得结构化结果
- **数据集**：获取商品详情、职位列表、社交媒体资料等数据

无需浏览器自动化。无需配置代理。只需导入并配置，让模型自行决定何时使用每个工具。

---

## 快速开始

### 1. 安装

```bash
npm install @brightdata/ai-sdk ai zod
```

### 2. 获取 API 密钥

在 [brightdata.com](https://www.bright.cn/cp) 注册，并从控制面板获取你的 API 密钥。

将其设置为环境变量，或放入项目根目录下的 `.env`：

```bash
BRIGHTDATA_API_KEY="your_api_key"
```

如果你更喜欢使用 shell 导出：

```bash
export BRIGHTDATA_API_KEY="your_api_key"
```

### 3. 运行你的第一个智能体

```typescript
import { anthropic } from '@ai-sdk/anthropic';
import { generateText, stepCountIs } from 'ai';
import { scrape, search } from '@brightdata/ai-sdk';

const { text } = await generateText({
    model: anthropic('claude-sonnet-4-5-20250929'),
    tools: {
        scrape: scrape(),
        search: search(),
    },
    stopWhen: stepCountIs(5),
    prompt: 'Find and summarize the top 3 trending AI papers this week.',
});

console.log(text);
```

模型将自主决定何时搜索网络，以及何时抓取特定页面。

---

## 可用工具

| 工具 | 说明 | 关键输入 |
|---|---|---|
| `scrape` | 抓取任意 URL 并转换为干净的 Markdown 或 HTML | `url`, `country` |
| `search` | 搜索 Google、Bing 或 Yandex | `query`, `search_engine`, `country` |
| `amazon_product` | 获取 Amazon 商品详情、价格和评论 | `url`, `zipcode` |
| `linkedin_profile` | 采集 LinkedIn 个人资料数据 | `urls`（数组） |
| `linkedin_jobs` | 查找 LinkedIn 职位信息 | `location`, `keyword`, `country` |
| `instagram_profile` | 获取 Instagram 个人资料信息和帖子 | `url` |
| `facebook_profile` | 采集 Facebook 个人资料数据 | `url` |
| `chatgpt` | 采集 ChatGPT 回复，并可选择启用网页搜索 | `prompt`, `web_search` |

---

## 使用示例

### 网络研究智能体

结合抓取和搜索功能，构建一个可以研究任何主题的智能体：

```typescript
import { openai } from '@ai-sdk/openai';
import { generateText, stepCountIs } from 'ai';
import { scrape, search, amazon_product } from '@brightdata/ai-sdk';

const { text } = await generateText({
    model: openai('gpt-4o'),
    tools: {
        scrape: scrape(),
        search: search(),
        amazon_product: amazon_product(),
    },
    stopWhen: stepCountIs(10),
    prompt: 'Search for the best noise-cancelling headphones and compare'
        + ' prices on Amazon',
});
```

### 使用 Next.js App Router 进行流式传输

```typescript
// app/api/research/route.ts
import { anthropic } from '@ai-sdk/anthropic';
import { streamText, stepCountIs } from 'ai';
import { scrape, search } from '@brightdata/ai-sdk';

export async function POST(req: Request) {
    const { prompt } = await req.json();

    const result = streamText({
        model: anthropic('claude-sonnet-4-5-20250929'),
        tools: {
            scrape: scrape(),
            search: search(),
        },
        stopWhen: stepCountIs(5),
        prompt,
    });

    return result.toDataStreamResponse();
}
```

### 查找 LinkedIn 职位

```typescript
import { generateText, stepCountIs } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { linkedin_jobs, linkedin_profile } from '@brightdata/ai-sdk';

const { text } = await generateText({
    model: anthropic('claude-sonnet-4-5-20250929'),
    tools: {
        linkedin_jobs: linkedin_jobs(),
        linkedin_profile: linkedin_profile(),
    },
    stopWhen: stepCountIs(5),
    prompt: 'Find senior software engineer jobs in San Francisco'
        + ' and show me the profiles of people in similar roles.',
});
```

### 社交媒体情报

```typescript
import { generateText, stepCountIs } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { instagram_profile, facebook_profile } from '@brightdata/ai-sdk';

const { text } = await generateText({
    model: anthropic('claude-sonnet-4-5-20250929'),
    tools: {
        instagram: instagram_profile(),
        facebook: facebook_profile(),
    },
    stopWhen: stepCountIs(5),
    prompt: 'Analyze the social media presence for @natgeo on Instagram.',
});
```

### 按需选择单个工具

你不必一次使用所有工具：只需导入所需工具：

```typescript
import { scrape } from '@brightdata/ai-sdk';

const scrape_tool = scrape({
    api_key: 'your_api_key',
    data_format: 'html',
    country: 'us',
});
```

---

## 配置

每个工具工厂函数都接受一个选项对象。常用选项：

| 选项 | 类型 | 说明 |
|---|---|---|
| `api_key` | `string` | Bright Data API 密钥。未提供时，将使用进程环境中的 `BRIGHTDATA_API_KEY` 或 `.env` 文件。 |
| `data_format` | `string` | 输出格式（`'markdown'`、`'html'`）。具体选项因工具而异。 |
| `country` | `string` | 用于地理位置定向请求的两字母国家/地区代码。 |

### 工具专属选项

**`search()`** 还接受：
- `search_engine`：`'google'` | `'bing'` | `'yandex'`（默认值：`'google'`）

**`linkedin_profile()`** 和 **`facebook_profile()`** 还接受：
- `format` — `'json'` | `'jsonl'`

**`chatgpt()`** 还接受：
- `format` — `'json'` | `'jsonl'`

---

## 要求

- Node.js 18+
- [Vercel AI SDK](https://www.npmjs.com/package/ai) v5 或 v6
- [Zod](https://www.npmjs.com/package/zod) v4+
- 一个 [Bright Data](https://www.bright.cn/cp) API 密钥

---

## 相关资源

- [`@brightdata/sdk`](https://www.npmjs.com/package/@brightdata/sdk)：此软件包基于该 Bright Data 核心 SDK 构建
- [Vercel AI SDK](https://sdk.vercel.ai)：这些工具所接入的 AI 框架
- [Bright Data 文档](https://docs.brightdata.com/integrations/vercel-ai-sdk)：完整集成指南

---

## 许可证

[MIT](LICENSE) - Bright Data

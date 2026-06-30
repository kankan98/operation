# 后端压测脚手架（load-tests）

本目录提供可直接运行的后端 API 压测脚本，覆盖 OpenSpec 性能任务：

| 任务 | 目标 | 脚本 | 工具/方式 |
| --- | --- | --- | --- |
| 12.1 | ~100 并发 SSE 连接（并发数可配置） | `sse-concurrency.mjs` | Node 内置 `http` 自定义脚本 |
| 12.4 | 产品列表（REST）p95 延迟 | `rest-latency.mjs` | [autocannon](https://github.com/mcollina/autocannon) |
| 12.5 | SSE 首字内容延迟（首个 `content_delta`） | `sse-concurrency.mjs`（TTFC 指标） | 同上 |
| 12.6 | 基线指标记录模板（回归追踪） | `BASELINE_METRICS.md` | Markdown 表格模板 |

> 注意：这些脚本会对**真实运行的后端**发压，SSE 脚本还会**真实调用 LLM、消耗 API 额度**。
> 请在受控环境下运行，并合理设置并发数。

---

## 一、前置条件

1. **安装依赖**（autocannon 已加入 `backend/package.json` 的 devDependencies）：

   ```bash
   pnpm install
   ```

   > 本脚手架交付时**未自动安装**。`rest-latency.mjs` 依赖 autocannon；`sse-concurrency.mjs` 仅用 Node 内置模块，无需额外依赖。

2. **启动后端**（默认监听 `http://localhost:3001`，端口由 `backend/.env` 的 `PORT` 决定）：

   ```bash
   pnpm --filter backend dev
   ```

3. **配置 LLM API Key**（仅 SSE 脚本需要）：在 `backend/.env` 中设置有效的 Key，
   否则 SSE 不会产生真实 `content_delta`，TTFC 指标会全部记为失败。

   - Anthropic 协议：`APP_AI_PROVIDER=anthropic` + `APP_ANTHROPIC_API_KEY=...`
   - OpenAI 协议：`APP_AI_PROVIDER=openai` + `APP_OPENAI_API_KEY=...`

4. **（可选）准备数据**：REST 压测查询 `GET /api/products`。若产品表为空也能跑通
   （返回空列表），但建议先导入一定量数据以贴近真实查询成本。

---

## 二、环境变量

所有脚本共用以下约定（按需覆盖）：

| 变量 | 默认值 | 适用脚本 | 说明 |
| --- | --- | --- | --- |
| `BASE_URL` | `http://localhost:3001` | 全部 | 后端地址 |
| `CONCURRENCY` | REST=50 / SSE=100 | 全部 | 并发连接数 |
| `DURATION` | `20` | REST | 压测时长（秒） |
| `PRODUCTS_PATH` | `/api/products?page=1&limit=20` | REST | 被测路径与查询参数 |
| `MESSAGE` | 简短中文问候 | SSE | 发送的用户消息（控制 token 消耗） |
| `SESSION_ID` | `new` | SSE | 会话 ID，`new` 表示每个连接自动新建会话 |
| `TIMEOUT_MS` | `120000` | SSE | 单连接超时（毫秒） |
| `RAMP_MS` | `0` | SSE | 连接爬坡总时长（毫秒），>0 时在该窗口内均匀发起连接 |

Windows PowerShell 设置环境变量的写法与 bash 不同，示例见下方各脚本。

---

## 三、运行方式

### 1. REST 产品列表 p95 延迟（任务 12.4）

```bash
# bash / Git Bash
node backend/load-tests/rest-latency.mjs
CONCURRENCY=100 DURATION=30 node backend/load-tests/rest-latency.mjs
```

```powershell
# PowerShell
node backend/load-tests/rest-latency.mjs
$env:CONCURRENCY=100; $env:DURATION=30; node backend/load-tests/rest-latency.mjs
```

输出包含：总请求数、平均吞吐量、非 2xx/错误/超时计数，以及延迟分布
（avg / p50 / p90 / **p95** / p99 / max），并在结尾打印一行 `METRICS_JSON {...}`
便于归档。

被测接口已核对：`GET /api/products`，支持查询参数 `platform`、`monitoring`(true/false)、
`page`、`limit`；响应形如 `{ data: [...], total, pagination: { page, limit, totalPages } }`。

### 2. SSE 并发 + 首字内容延迟（任务 12.1 / 12.5）

```bash
# bash / Git Bash
node backend/load-tests/sse-concurrency.mjs
CONCURRENCY=100 node backend/load-tests/sse-concurrency.mjs
# 用爬坡避免瞬时风暴：5 秒内均匀发起 20 个连接
CONCURRENCY=20 RAMP_MS=5000 node backend/load-tests/sse-concurrency.mjs
```

```powershell
# PowerShell
$env:CONCURRENCY=100; node backend/load-tests/sse-concurrency.mjs
```

被测接口已核对：`GET /api/chat/sessions/:id/stream?content=<urlencoded>`，
`:id=new` 自动创建会话。响应为 `text/event-stream`：首先写入 `:ok` 心跳，
随后是 `data: {...}` 事件行（`message_start`、`text_start`、`content_delta`、
`text_end`、`tool_start`/`tool_complete`、`usage_complete` 等），
终止事件为 `message_complete` 或 `error_occurred`；运行期间每 15 秒一个
`: heartbeat` 注释心跳。

脚本对每个连接测量并汇总：

- **TTFB**：到首字节（通常即 `:ok`）的时间；
- **TTFC**：到第一个 `content_delta` 事件的时间（即「首字内容延迟」，任务 12.5）；
- **总耗时**：到 `message_complete` 的时间；
- 成功 / 失败连接数（任务 12.1 的并发承载与稳定性）。

每个指标输出 min / avg / p50 / **p95** / max，并在结尾打印 `METRICS_JSON {...}`。

> 建议先用 `CONCURRENCY=2` 做一次冒烟，确认能拿到 `content_delta`（即 Key 生效），
> 再逐步加到 100。

---

## 四、记录基线（任务 12.6）

把每次结果填入 [`BASELINE_METRICS.md`](./BASELINE_METRICS.md) 的表格，并在「测试环境记录」
里填好日期、commit、机器、Node 版本、LLM 模型、数据规模等，保证不同次结果可对比。
回归判定建议见该文档末尾（p95 劣化 >20% 或 SSE 成功率下降 >1 个百分点时排查）。

---

## 五、脚本自检（不发压）

修改脚本后可仅做语法校验，不需要启动服务器：

```bash
node --check backend/load-tests/rest-latency.mjs
node --check backend/load-tests/sse-concurrency.mjs
```

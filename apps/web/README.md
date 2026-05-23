# 羽拍直播运营工作台 Web App

这是仓库的第一个应用，位于 `apps/web`。当前前端基线已经包含 Next.js
应用、Docker 构建、中文运营工作台 shell、真实工作区路由和全局主题
token。

## 本阶段包含

- Next.js App Router + TypeScript + React。
- Tailwind CSS + shadcn/ui-compatible primitives。
- lucide-react 图标。
- 根级 pnpm workspace 脚本。
- 中文内部运营工作台骨架。
- 真实工作区路由：`/sessions`、`/rackets`、`/knowledge`、`/ai-review`、
  `/talk-tracks`、`/next-actions`。
- 基于 `globals.css` CSS 变量的全局主题 token。
- `/sessions` 静态直播场次采集工作台、`/rackets` 静态球拍产品库、
  `/knowledge` 静态学习中枢和
  `/ai-review` 静态复盘工作台。
- loading、error、not-found 基线状态。

## 本阶段不包含

- 账号登录与团队权限。
- PostgreSQL、Drizzle schema、迁移或真实数据持久化。
- AI provider 调用、提示词、结构化输出或分析任务。
- 公开来源采集、种子知识库刷新、审核队列或版本回滚。
- 文件存储、导出、抖音/电商平台集成、分析埋点、支付或部署配置。

## 开发路线

项目级持续迭代路线见
[`docs/roadmap/autonomous-development-roadmap.md`](../../docs/roadmap/autonomous-development-roadmap.md)。
后续新增路由、表单、数据模型、AI 行为、知识库能力、主题风格或动效模式时，先更新
OpenSpec，再让 README、路线文档和公网预览状态保持一致。

路线文档中的 Now/Next/Later 是当前开发顺序参考，不是绕过 OpenSpec 的授权。
主题和动效调整继续通过 `src/app/globals.css` 的全局 token 与
`src/components/workspace-motion.tsx` 的本地 primitives 管理，避免在页面内局部写死。

## 工作区路由

| 路由 | 当前用途 |
| --- | --- |
| `/` | 工作台总览、线路状态和未实现能力边界 |
| `/sessions` | 直播场次采集工作台，展示主题、主播、商品顺序、问题异议和草稿状态 |
| `/rackets` | 球拍产品库工作台，展示型号、规格、别名、审核状态和下游准备 |
| `/knowledge` | 知识库学习中枢，展示公开来源注册、审核刷新和 AI 反馈闭环 |
| `/ai-review` | AI 复盘工作台，展示人工事实、知识依据、结构化输出、审核动作和反馈信号 |
| `/talk-tracks` | 话术资产占位页 |
| `/next-actions` | 下场任务占位页 |

除 `/sessions`、`/rackets`、`/knowledge` 和 `/ai-review` 已升级为静态工作台外，其余工作流页面
当前只展示静态中文规划内容，不读取、不保存、不生成真实业务数据，也不调用 AI 或
外部平台。

`/sessions` 当前展示的是静态手动采集工作台：场次主题、主播、直播日期、目标人群、
商品讲解顺序、问题异议、讲解缺口、草稿状态和下游准备都只是字段结构预览。它不会
保存草稿、上传转录、解析文本、读取平台数据、调用 AI 或创建复盘任务。后续真正实现
场次采集时，需要新增 OpenSpec 变更定义表单校验、草稿自动保存、刷新恢复、租户权限、
长文本容量、转录上传和 AI 复盘输入边界。

`/rackets` 当前展示的是静态球拍产品库工作台：型号、别名、重量级别、平衡点、
中杆硬度、推荐磅数、适合人群、打法、价格带、卖点、来源新鲜度、审核状态和下游准备
都只是字段结构预览。它不会保存产品、导入来源、合并别名、调用 AI、写入知识库或读取
真实团队数据。后续真正实现产品库时，需要先补 `racket-product-library` 契约，再定义
PostgreSQL/Drizzle schema、租户权限、来源审核、别名合并、检索和 AI grounding 边界。

`/knowledge` 当前展示的是静态来源元数据和学习闭环结构，不会自动抓取网站、
写入数据库、调用 AI 或生成运营建议。后续真正实现知识库时，需要新增 OpenSpec
变更定义采集方式、数据表、审核队列、刷新任务、AI grounding 和反馈评估。

`/ai-review` 当前展示的是静态 AI 复盘工作台：人工输入样例、知识依据分层、
结构化复盘输出、失败校验状态、人工审核动作和反馈学习信号都只是未来流程预览。
它不会执行 prompt、调用模型、保存反馈、创建任务或把任何建议写入知识库。后续真正
实现 AI 复盘时，需要新增 OpenSpec 变更定义 provider、prompt 版本、输出 schema、
重试/拒绝/超时处理、人工审核记录、反馈评估和持久化边界。

## 后续路线：问答 Agent 与自主学习

未来可以新增一个面向运营用户的问答 Agent，用来回答羽毛球拍产品、直播讲解、
客户异议、话术优化、短视频选题和运营复盘相关问题。该能力必须分阶段实现：

1. 先从已审核知识库和团队知识回答问题，并明确区分来源事实、人工经验和 AI 推断。
2. 支持用户对答案点赞、点踩、编辑或补充原因，把反馈作为可审计信号。
3. 当知识库不足或过期时，AI 可以通过允许的公开网络来源寻找答案，展示引用来源和
   不确定性，而不是直接把搜索结果当作权威结论。
4. 有价值的新来源或答案需要进入知识库生命周期：来源元数据、信任等级、抓取/检索时间、
   人工审核、版本记录和刷新策略齐全后，才能用于后续回答。
5. 每次用反馈或新知识改进 agent 前，都要用代表性运营问题做评测，确认答案质量、
   来源可追溯性和安全边界没有退化。

这个路线会涉及 AI provider、网络搜索、知识持久化、审核队列、租户数据隔离、
滥用防护和答案质量评估，不能在没有 OpenSpec 变更的情况下直接接入。

## 主题 token

全局视觉主题位于 `src/app/globals.css`。组件应优先使用 shadcn/Tailwind
语义类，例如 `bg-background`、`bg-card`、`text-muted-foreground`、
`border-border`、`text-primary`、`bg-sidebar`，不要在组件内散落硬编码色值。

当前 token 覆盖：

- shadcn 基础语义：`background`、`foreground`、`card`、`primary`、
  `secondary`、`muted`、`accent`、`destructive`、`border`、`input`、`ring`。
- 侧栏语义：`sidebar`、`sidebar-foreground`、`sidebar-accent` 等。
- 产品扩展：`surface`、`surface-subtle`、`surface-strong`、`success`、
  `warning`、`info`。
- 图表预留：`chart-1` 到 `chart-5`。

视觉方向是现代、冷静、数据密集的运营后台：冷灰表面、青蓝主色、琥珀强调和
混合图表色。后续页面应通过 token 调整整体风格，而不是局部覆盖颜色。

### 主题治理规则

后续如果要替换为新的品牌风格、色彩体系、暗色主题、密度或圆角风格，优先修改
`src/app/globals.css` 中的 token，而不是逐个页面改 class。

必须全局管理的内容：

- 品牌色、文字色、背景、卡片、边框、侧栏、状态色和图表色。
- 工作台面板半径、行半径、图标面尺寸、面板阴影、状态色背景/边框/文字。
- 动效时长、缓动、入场距离、hover 反馈和 reduced-motion 行为。
- focus ring、选中态、禁用态、成功/警告/信息等语义状态。

允许局部保留的内容：

- 页面自己的 grid track、响应式列数、信息排列顺序。
- 与具体内容长度有关的 `min-h-*`、`gap-*`、`px/py`，但不要承载品牌色或状态色。
- 单个业务组件的字段布局和移动端折叠方式。

当前工作台通用 utility：

- `workbench-panel`：主面板/card 的背景、边框、圆角、阴影。
- `workbench-row`：面板内行、子卡片、列表项的背景、边框、圆角。
- `workbench-icon-surface`：状态图标容器尺寸和圆角。
- `workbench-status-default|success|warning|info|muted`：状态色背景、边框、文字。

组件中不要写 `bg-blue-*`、`text-purple-*`、`border-green-*`、hex/rgb/oklch
等局部色值。确实需要新增颜色或视觉语义时，先在 OpenSpec 中说明用途，再加到
`globals.css` 的 token 层。

## 动效标准

工作台动效以“帮助理解结构和状态”为目标，不做营销式大动画。全局动效 token
定义在 `src/app/globals.css`：

- 时长：`--motion-duration-fast`、`--motion-duration-standard`、
  `--motion-duration-slow`。
- 缓动：`--motion-ease-standard`、`--motion-ease-emphasized`、
  `--motion-ease-enter`、`--motion-ease-exit`。
- 距离和模糊：`--motion-distance-sm`、`--motion-distance-md`、
  `--motion-blur-enter`。
- 工具类：`motion-interactive`、`motion-panel`、`motion-row`。

React 级页面和区块编排使用 `motion`，并且只通过
`src/components/workspace-motion.tsx` 里的本地 primitives 使用：

- `WorkspaceMotionProvider`
- `MotionPage`
- `MotionPanel`
- `MotionListItem`

使用规则：

- 页面和区块入场应短、轻、非循环。
- hover/press 反馈优先用 CSS token 和 `motion-interactive`。
- 必须尊重 `prefers-reduced-motion`，不要绕过全局 reduced-motion 规则。
- 不使用视差、滚动劫持、自动播放视频、无限循环装饰动画。
- 占位页面的动画不能暗示真实加载、保存成功、AI 生成中或外部平台已连接。

## 本地命令

从仓库根目录运行：

```bash
pnpm install
pnpm dev
pnpm lint
pnpm typecheck
pnpm build
pnpm check
```

开发服务器默认地址为 `http://localhost:3000`。

## Docker 部署

### 前提

本地需要安装 Docker。不支持在 Docker 内嵌套运行 Docker（DooD），
但 CI 环境下可以使用 Docker-in-Docker。

### 构建生产镜像

```bash
# 从仓库根目录运行
pnpm docker:build
# 或直接使用 docker
# docker build -t operation-web .
```

构建使用三阶段多阶段构建：
1. `deps` — 安装依赖
2. `builder` — 编译应用
3. `runner` — 只包含生产产物和运行时依赖

默认基础镜像为 ECR Public 上的 Docker Official `node:24-alpine`
镜像，以避免当前服务器网络下 Docker Hub 拉取超时。需要改回 Docker Hub
时可以覆盖 build arg：

```bash
docker build --build-arg NODE_IMAGE=node:24-alpine -t operation-web .
```

### 运行生产容器

```bash
pnpm docker:run
# 或
# docker run --rm -p 3000:3000 operation-web
```

应用将在 `http://localhost:3000` 可用。

### 环境变量

| 变量 | 必需 | 说明 | 默认值 |
|----------|----------|-------------|---------|
| `PORT` | 否 | 服务监听端口 | `3000` |
| `HOSTNAME` | 否 | 服务监听地址 | `0.0.0.0` |
| `NODE_ENV` | 否 | 运行模式 | `production` |

示例：

```bash
docker run --rm -p 8080:8080 -e PORT=8080 operation-web
```

### 本地开发 Compose

```bash
docker compose up
```

这会启用 Turbopack 热重载，源代码通过 bind-mount 映射到容器内。

停止：

```bash
docker compose down
```

### 生产 Compose 验证

```bash
docker compose --profile prod up web-prod
```

该命令会构建生产镜像并用 production runner 启动容器。停止：

```bash
docker compose --profile prod down
```

### 健康检查

生产镜像内置 Docker HEALTHCHECK，每 30 秒检查 `/` 路由。
可以在 `Dockerfile` 中调整间隔和超时参数。

### 镜像大小

基于 `node:24-alpine`，最终镜像约 300–500 MB。
未来加入数据库驱动、AI SDK 后可能增长。

## 浏览器验证

启动开发服务器后，使用 Playwright helper 检查桌面和移动端视口：

```bash
export CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
export PWCLI="$CODEX_HOME/skills/playwright/scripts/playwright_cli.sh"

"$PWCLI" --session bootstrap open http://localhost:3000
"$PWCLI" --session bootstrap snapshot
"$PWCLI" --session bootstrap close
```

验证重点：

- 根页面能加载。
- 控制台无错误。
- 中文文本不溢出、不重叠。
- 移动端导航按钮可打开。
- 页面清楚标注未实现能力，不展示真实业务数据。

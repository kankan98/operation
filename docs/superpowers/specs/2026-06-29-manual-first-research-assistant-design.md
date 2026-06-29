# 设计：手动优先的选品研究助手

> 状态：已确认方向，进入实现。负责人按此文档自主推进。
> 日期：2026-06-29

## 背景与定位

本项目（README 标题 *E-commerce Price Monitoring System*）的真实定位经澄清确定为：

- **个人/自用的选品研究工具**，准确性 > 规模。
- 用户**未配置任何付费数据源**（Rainforest / Keepa 均未配），且**不愿付费**，希望先免费跑通。
- 因此系统长期"空跑"：走浏览器抓取（Amazon 常封）+ 缓存兜底，数据缺失/过时。
- **核心痛点是数据层（输入不可信）**，不是评分结论或操作流程。

### 战略判断

纯免费、稳定、自动拿到 Amazon 数据基本不可能。因此放弃"自动采集管道"幻觉，转向**以手动录入为主、工具负责算账和追踪、所有数据点标注来源与新鲜度**的研究助手。

当前 roadmap 主线 P5 `acquisition-queue-operations`（BullMQ/Redis、worker heartbeat、stale lease）以及 Phase 7-9（多平台扩展、Docker、用户认证/多租户）对个人自用属于过度工程，应降级或砍掉。

## 目标

1. 让用户敢信数据：每个数据点自带来源 + 新鲜度，缺失/过时/假设绝不伪装成已验证事实。
2. 让手动录入顺手：用户能把亲眼看到的数字（当前价、BSR、评分、评论数、几个历史价格点）快速录入。
3. 让评分透明可否决：去掉魔法数字，展示"因为 A/B/C 所以这样排"，并按来源/新鲜度调可信度。
4. 做减法：停用并逐步移除自动采集管道、队列运维、调度器等死重量。
5. 重写 roadmap，对齐"单人选品决策质量"。

## 设计（5 节）

### 第 1 节：数据来源模型（地基）

- 给 `price_snapshots` 表加 `source` 列：`manual` | `browser` | `cache` | `keepa` | `rainforest`（沿用已有 provider 命名）。
- `manual` 为一等公民：录入时刻可信度最高，但明确是"某一时点快照"，超过新鲜度阈值即标"可能已过时，建议复核"。
- 下游（评分、产品详情、Chat）统一读 source + timestamp 推导可信度展示；缺失显示缺失，过时显示过时。
- 改动：一次加列迁移 + 写快照处带上 source。风险低。

### 第 2 节：手动录入做成一等流程

- "记录一次读数"表单：单产品录入 price / salesRank(BSR) / rating / reviewCount / availability / 日期，落 `price_snapshots` 并标 `source=manual`。
- 支持补录少量历史价格点（按日期），用于在没有 Keepa API 时手动重建趋势。
- 按需单品浏览器抓取保留为便利按钮：成功写 `source=browser` 快照；失败则打开手动表单兜底。无批量、无调度器。

### 第 3 节：透明评分

- 保留 factor/weight 结构但全部外显：每个 factor 展示 raw value → 为何这个分 → 贡献度。
- 用可解释规则替换 `opportunityScoringService.ts` 中 `50 + netMargin*120` 一类魔法常量；常量集中、命名、给出依据注释。
- 评分按输入的 source/新鲜度 gate 可信度：关键输入为过时 manual 或缺失时降 confidence 并在 UI 说明，绝不让过时数字驱动高置信"buy"。
- "opportunity score" 重新定位为"对你录入信息的透明汇总"，用户可否决/忽略单个 factor。

### 第 4 节：砍掉死重量

- 默认停用调度器（node-cron）与队列（`scrapeJobs`/`scrapeAttempts`/workers/provider limits）；停止 P5 后续开发。
- 分阶段移除而非一次硬删：先默认关闭 + 标记 deprecated，确认无回归后再删代码、表、相关 OpenSpec 规格。
- 保留按需单品浏览器抓取。

### 第 5 节：重写 roadmap

- 用 ①来源模型 → ②手动录入 → ③透明评分 → ④做减法 → ⑤（可选）将来想付费时一键接 Keepa 替换 roadmap 中的 P5 / Phase 7-9。

## 非目标（YAGNI）

- 不做多用户/认证/权限。
- 不做 Docker/CI/多 worker 队列。
- 不追加新平台 crawler。
- 不追求"全自动免费拿 Amazon 数据"。

## 实施顺序

1 → 2 → 3 为价值主线，先做。4（做减法）与 5（roadmap）穿插推进，做减法用分阶段停用以控风险。

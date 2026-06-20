# 选品机会评分说明

`product-opportunity-scoring` 的 MVP 目标是把现有商品、价格快照和采集观测数据转成一个可解释的优先级排行。评分用于决定“下一步先看哪些商品”，不是利润、销量或真实需求的最终判断。

`opportunity-business-signals` 进一步加入商家输入的业务假设：成本、头程/尾程、履约/FBA、平台固定费用、佣金比例、广告成本、税费缓冲和目标售价。系统会基于这些假设计算利润率、ROI、盈亏平衡价和单件贡献利润，但这些仍是“商家假设计算”，不是平台验证的销量、需求或真实费用事实。

## 评分输出

- `score`: 0-100 的机会分，越高越值得优先研究。
- `confidence`: 0-1 的可信度，表示当前数据是否足够支撑评分。
- `recommendation`: `investigate`、`watch`、`check_data` 或 `ignore`。
- `factors`: 每个评分因子的归一化分、权重、贡献值和解释。
- `missingSignals`: 明确列出缺失或暂不支持的信号。
- `acquisitionHealth`: 最近一次采集的 provider、状态、失败原因、置信度、耗时和新鲜度。
- `businessSignals`: 业务假设完整度、缺失业务信号、假设财务指标和 caveat。

## 当前因子

| 因子 | 权重 | 方向 | 说明 |
| --- | ---: | --- | --- |
| `price_position` | 0.20 | 当前价低于历史均价更好 | 判断当前价格是否处于相对低位。 |
| `price_trend` | 0.18 | 近期下跌更好 | 使用可用历史价格的变化百分比。 |
| `price_stability` | 0.12 | 波动低更好 | 价格过度波动会降低稳定性评分。 |
| `acquisition_health` | 0.18 | 最近成功采集更好 | 采集成功、数据新鲜、provider 置信度高会加分。 |
| `review_proxy` | 0.12 | 评分/评论更多更好 | 只作为评价热度代理，不等同真实需求。 |
| `availability` | 0.10 | 有货更好 | 缺货会降低机会分。 |
| `monitoring_status` | 0.10 | 已监控更好 | 已纳入监控的商品数据连续性更好。 |
| `business_net_margin` | 0.10 | 净利率越高越好 | 仅在业务假设完整时加入评分。 |
| `business_roi` | 0.10 | ROI 越高越好 | 仅基于商家输入的成本和费用计算。 |
| `business_breakeven_distance` | 0.06 | 售价高于盈亏平衡价越多越好 | 用于判断价格安全垫。 |
| `business_contribution_profit` | 0.06 | 单件贡献利润越高越好 | 用于判断每售出一件的假设利润空间。 |

## 业务指标公式

- `referralFee = sellPrice * referralFeeRate`
- `totalVariableCost = costBasis + inboundShipping + outboundShipping + fulfillmentFee + platformFee + referralFee + advertisingCost + taxCustomsBuffer`
- `contributionProfitPerUnit = sellPrice - totalVariableCost`
- `grossMargin = (sellPrice - costBasis) / sellPrice`
- `netMargin = contributionProfitPerUnit / sellPrice`
- `roi = contributionProfitPerUnit / costBasis`
- `breakevenSellPrice = fixedCosts / (1 - referralFeeRate)`

其中 `sellPrice` 优先使用商家输入的 `targetSellPrice`，没有目标售价时使用当前监控价格。缺少任一必要字段时，系统会把对应业务信号列入 `missingSignals`，不会把缺失成本或费用当作 0。

## 推荐动作

- `investigate`: 分数高且可信度足够，建议进入人工选品研究。
- `watch`: 有一定潜力，但仍需继续观察价格和采集稳定性。
- `check_data`: 缺价格历史、缺采集历史或可信度偏低，建议先触发手动采集或补充数据。
- `ignore`: 当前信号弱，短期不用优先投入。

## 明确限制

当前版本仍把以下信号列为缺失或未支持：

- `sales_volume`: 未接入平台销量、订单、BSR 历史或第三方销量估算。
- `demand`: 未接入搜索量、关键词趋势、广告点击、类目需求或 Keepa/平台趋势。

如果业务假设不完整，`profit_margin` 仍会被列为缺失信号。因此，Chat 和前端解释都必须保留 caveat：不要仅凭该分数宣称“利润已验证”“销量好”或“需求已验证”。高分商品只能表示它在当前可用信号和商家输入假设下更值得下一步核查。

## 推荐商家流程

1. 先通过机会工作台按 score、confidence 和采集健康度筛出候选商品。
2. 在产品详情补充单件成本、头程、尾程/履约、平台费用、佣金比例、广告成本、税费缓冲和目标售价。
3. 回到机会工作台使用 business readiness 和 minimum ROI 筛选。
4. 对 `investigate` 的商品继续核查供应链、真实销量、需求趋势和竞争强度。
5. 对 `check_data` 的商品先补采集数据或业务假设，不直接下结论。

## 下一步增强

- 接入 Keepa/Rainforest/PA-API 等可用需求和类目信号。
- 引入多套假设场景，例如 conservative/base/aggressive。
- 将评分权重配置化，允许按类目或运营策略调整。
- 记录评分版本，保证历史排行可追溯。

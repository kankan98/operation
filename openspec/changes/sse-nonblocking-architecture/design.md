## Context

当前系统使用两步流式模式处理 SSE 聊天：
1. 前端发送 POST /api/chat/sessions/:id/stream，同步等待响应（包含 streamId）
2. 后端在 POST 处理期间执行工具调用（数据库查询，耗时 2-10 秒）
3. 前端收到响应后，再建立 GET /api/chat/sse/:streamId 连接

**问题**：POST 请求中的 `await client.post()` 阻塞 JavaScript 主线程，导致用户无法切换页面、点击按钮或进行任何 UI 交互。后端工具执行中的数据库查询（如 `listProducts(limit: 1000)`）进一步加剧阻塞时长。

**约束**：
- 必须保持 SSE 事件协议不变（前端已有大量事件处理逻辑）
- 必须支持新会话创建和已有会话继续
- 数据库优化不能影响功能完整性

**利益相关方**：
- 前端用户：期望流畅的交互体验，无卡顿
- 后端开发：需要简化架构，移除内存管理器
- 运维：希望减少服务器内存占用和数据库负载

## Goals / Non-Goals

**Goals:**
- 前端立即返回，彻底消除主线程阻塞
- 后端异步处理消息，SSE 事件驱动 UI 更新
- 移除 StreamManager 内存管理器，简化架构
- 优化数据库查询性能，减少工具执行耗时
- 保持 SSE 事件协议和前端事件处理逻辑不变

**Non-Goals:**
- 不改变 SSE 事件类型和数据格式（message_start, text_delta, tool_start 等）
- 不重写前端状态管理（chatStore）
- 不迁移到 WebSocket 或其他协议
- 不修改 AI Provider 接口（anthropicProvider, chatService）
- 不改变数据库 schema（仅优化查询）

## Decisions

### Decision 1: GET 请求直接建立 SSE 连接

**选择**：使用 GET /api/chat/sessions/:id/stream?content=xxx 直接返回 SSE 响应

**理由**：
- GET 请求是 EventSource API 的标准方式
- 立即返回 SSE headers，无需等待后台任务完成
- 消除两步握手，移除 streamManager 内存管理复杂度

**备选方案**：
- **方案 A2**（POST + 快速返回 + 后台 worker）：需要引入任务队列，增加架构复杂度，且有竞态条件风险
- **方案 A3**（WebSocket）：需要重写整个协议层，部署复杂度高，负载均衡器配置复杂

**权衡**：
- ✅ 优势：架构最简单，代码改动最小，符合 HTTP 标准
- ⚠️ 限制：URL 长度限制 ~2KB（聊天消息通常 <500 字符，完全够用）

### Decision 2: 消息内容通过 URL 查询参数传递

**选择**：使用 `?content=<encodeURIComponent(message)>` 传递消息

**理由**：
- GET 请求无 request body
- EventSource API 不支持自定义 headers 或 body
- URL 编码可以安全传输特殊字符和换行符

**备选方案**：
- **方案 B**（先 POST 创建任务，再 GET SSE）：回到两步模式，未解决阻塞问题
- **方案 C**（WebSocket）：如前所述，过于复杂

**权衡**：
- ✅ 优势：简单直接，浏览器原生支持
- ⚠️ 限制：消息长度受 URL 限制（实际应用中足够）

### Decision 3: 移除 StreamManager 全局管理器

**选择**：每个 SSE 连接直接处理自己的 AsyncGenerator，无需全局存储

**理由**：
- 单步 SSE 架构下，HTTP 响应对象本身就是"流"的容器
- 无需通过 streamId 查找对应的 generator
- 减少内存占用，避免过期清理逻辑

**备选方案**：
- **保留 StreamManager**：增加不必要的复杂度，且需要处理过期、清理等边界情况

**权衡**：
- ✅ 优势：代码更简洁，内存占用更低
- ✅ 无明显劣势

### Decision 4: 数据库查询优化策略

**选择**：组合应用以下优化
- 减少 `listProducts` 默认 limit（1000 → 100）
- 添加字段选择参数（避免 SELECT *）
- 确保高频字段已索引（platform, isMonitoring）
- 短期内存缓存（TTL 30秒）

**理由**：
- 大多数工具调用不需要全部 1000 条产品
- SELECT * 传输大量不必要数据（如 metadata, imageUrl）
- 索引显著提升 WHERE 和 ORDER BY 性能
- 缓存减少重复查询（AI 常在短时间内多次调用同一工具）

**备选方案**：
- **方案 A**（仅减少 limit）：部分优化，未充分利用数据库能力
- **方案 B**（引入 Redis）：过度设计，增加运维复杂度

**权衡**：
- ✅ 优势：性能提升明显（预计查询耗时从 2-5 秒降至 200-500ms）
- ⚠️ 限制：需要验证缓存失效逻辑正确性

### Decision 5: 前端错误处理

**选择**：利用 EventSource 内置的 onerror 回调

**理由**：
- EventSource 自动处理连接失败、超时、网络中断
- 自动重连机制（默认 3 秒后重试）
- 简化前端逻辑，无需手动重连

**备选方案**：
- **手动重连逻辑**：增加复杂度，且容易出错

**权衡**：
- ✅ 优势：浏览器原生支持，可靠性高
- ⚠️ 限制：无法自定义重连策略（对于聊天应用足够）

## Risks / Trade-offs

### Risk 1: URL 长度限制

**风险**：极长消息（>2KB）可能超过 URL 限制

**缓解措施**：
- 前端在构造 URL 前检查长度，超过限制时提示用户分段发送
- 实际场景中，聊天消息很少超过 500 字符，该风险极低

### Risk 2: 缓存失效逻辑错误

**风险**：产品数据更新后，缓存未及时失效，AI 返回过期数据

**缓解措施**：
- 在所有写入操作（createProduct, updateProduct, deleteProduct）后显式清空缓存
- 添加单元测试验证缓存失效逻辑
- 设置短 TTL（30 秒），限制过期数据影响时长

### Risk 3: 数据库索引未生效

**风险**：索引未正确创建，查询性能未提升

**缓解措施**：
- 添加数据库迁移脚本，确保索引创建
- 部署后验证 EXPLAIN 查询计划，确认索引生效
- 添加慢查询日志监控（>500ms 记录警告）

### Risk 4: 旧客户端兼容性

**风险**：已部署的旧版前端仍调用旧端点，升级后无法使用

**缓解措施**：
- 这是 BREAKING CHANGE，需要前后端同步部署
- 部署前通知所有用户刷新页面
- 如有移动端 App，需强制更新

### Risk 5: EventSource 浏览器兼容性

**风险**：某些旧浏览器不支持 EventSource

**缓解措施**：
- 目标用户使用现代浏览器（Chrome, Firefox, Safari, Edge 均支持）
- 如需支持旧浏览器，可引入 polyfill（eventsource-polyfill）

## Migration Plan

### Phase 1: 数据库优化（可独立部署）
1. 添加数据库索引（不影响现有功能）
2. 修改 productService.listProducts() 支持 fields 参数
3. 更新 agentTools.getAllProducts() 使用新参数
4. 部署后验证查询性能提升

### Phase 2: SSE 架构变更（需同步部署）
1. 后端实现新的 GET /stream 端点
2. 前端重写 chatApi.streamMessage()
3. 验证所有 SSE 事件正常触发
4. 前后端同时部署
5. 移除旧端点和 streamManager

### Phase 3: 清理（部署后）
1. 删除 backend/src/services/streamManager.ts
2. 移除所有 streamManager 引用
3. 删除旧的两个端点（POST /stream, GET /sse/:id）
4. 更新 API 文档

### Rollback Strategy
- **Phase 1 回滚**：数据库索引可保留，不影响功能
- **Phase 2 回滚**：前后端回滚到旧版本，StreamManager 仍在代码中
- **紧急情况**：保留旧端点代码一周，快速回滚时重新启用

## Open Questions

### Q1: 是否需要保留两步模式作为备选？
**当前倾向**：否。单步模式更简单，且测试充分后风险可控。

### Q2: 缓存 TTL 如何配置？
**当前倾向**：环境变量 `PRODUCT_CACHE_TTL_MS`，默认 30000（30 秒）。

### Q3: 是否需要添加请求限流？
**当前倾向**：暂不需要。SSE 连接数由用户并发数决定，通常 <100。

### Q4: 数据库连接池大小如何配置？
**当前倾向**：CPU 核心数 * 2，最小 5，最大 20。通过环境变量 `DB_POOL_SIZE` 可调。

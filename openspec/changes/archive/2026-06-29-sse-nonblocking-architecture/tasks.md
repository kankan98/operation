## 1. Database Optimization (Phase 1 - Can Deploy Independently)

- [x] 1.1 添加数据库索引：在 products 表上创建 platform, isMonitoring 单列索引和 (platform, isMonitoring) 复合索引
- [x] 1.2 修改 ProductService.listProducts()：添加可选的 fields 参数（string[]），支持指定查询字段
- [x] 1.3 更新 listProducts 实现：当 fields 参数存在时，使用 Drizzle ORM 的 select() 仅查询指定字段
- [x] 1.4 修改 agentTools.getAllProducts()：调用 listProducts 时指定 fields: ['id', 'title', 'platform', 'currentPrice', 'currency', 'brand', 'category', 'isMonitoring']
- [x] 1.5 减少 listProducts 默认 limit：从 1000 改为 100
- [x] 1.6 实现简单内存缓存：在 agentTools.ts 中添加 Map 缓存，TTL 30 秒
- [x] 1.7 添加缓存失效逻辑：在 createProduct, updateProduct, deleteProduct 后清空缓存
- [x] 1.8 添加慢查询日志：在 productService 中记录耗时 >500ms 的查询
- [x] 1.9 验证索引生效：运行 EXPLAIN 查询计划，确认使用索引
- [x] 1.10 性能测试：对比优化前后 listProducts 查询耗时

## 2. Backend SSE Direct Connection (Phase 2 - Must Deploy with Frontend)

- [x] 2.1 创建新的 GET 端点：在 routes/chat.ts 添加 GET /api/chat/sessions/:id/stream
- [x] 2.2 解析查询参数：从 req.query.content 获取消息内容（Express 自动解码）
- [x] 2.3 设置 SSE 响应头：Content-Type: text/event-stream, Cache-Control: no-cache, Connection: keep-alive, X-Accel-Buffering: no
- [x] 2.4 发送初始心跳：res.write(':ok\n\n') 确保连接建立
- [x] 2.5 支持新会话创建：当 sessionId 为 "new" 时，调用 createSession() 创建新会话
- [x] 2.6 调用 chatService.streamMessage()：传入 sessionId, messageId (UUID), streamId (UUID), content
- [x] 2.7 循环推送 SSE 事件：for await (const event of generator) { res.write(`data: ${JSON.stringify(event)}\n\n`) }
- [x] 2.8 错误处理：捕获异常，推送 error_occurred 事件，关闭连接
- [x] 2.9 连接清理：在 try-finally 中确保 res.end() 被调用
- [x] 2.10 验证端点工作：使用 curl 测试 GET 请求是否立即返回 SSE 响应

## 3. Frontend SSE Direct Connection (Phase 2 - Must Deploy with Backend)

- [x] 3.1 重写 chatApi.streamMessage()：移除 await client.post() 调用
- [x] 3.2 构造 SSE URL：/api/chat/sessions/${sessionId}/stream?content=${encodeURIComponent(content)}
- [x] 3.3 创建 EventSource：const eventSource = new EventSource(url)
- [x] 3.4 注册 message_start 事件：eventSource.addEventListener('message_start', handler)
- [x] 3.5 注册 status_change 事件：eventSource.addEventListener('status_change', handler)
- [x] 3.6 注册 text_start 事件：eventSource.addEventListener('text_start', handler)
- [x] 3.7 注册 content_delta 事件：eventSource.addEventListener('content_delta', handler)
- [x] 3.8 注册 text_end 事件：eventSource.addEventListener('text_end', handler)
- [x] 3.9 注册 tool_start 事件：eventSource.addEventListener('tool_start', handler)
- [x] 3.10 注册 tool_complete 事件：eventSource.addEventListener('tool_complete', handler)
- [x] 3.11 注册 usage_complete 事件：eventSource.addEventListener('usage_complete', handler)
- [x] 3.12 注册 message_complete 事件：eventSource.addEventListener('message_complete', handler)
- [x] 3.13 注册 error_occurred 事件：eventSource.addEventListener('error_occurred', handler)
- [x] 3.14 注册 onerror 回调：处理连接失败，调用 handlers.onError()
- [x] 3.15 立即返回 cleanup 函数：() => { eventSource.close() }
- [x] 3.16 测试立即返回：确认 sendMessage() 调用后主线程不阻塞

## 4. Cleanup and Removal (Phase 3 - After Deployment)

- [x] 4.1 移除旧的 POST 端点：删除 POST /api/chat/sessions/:id/stream 路由处理器
- [x] 4.2 移除旧的 GET 端点：删除 GET /api/chat/sse/:streamId 路由处理器
- [x] 4.3 删除 streamManager.ts：删除 backend/src/services/streamManager.ts 文件
- [x] 4.4 移除 streamManager 引用：从 routes/chat.ts 移除 import { streamManager } from '../services/streamManager'
- [x] 4.5 移除 streamManager 调用：删除所有 streamManager.create(), streamManager.get() 调用
- [x] 4.6 清理类型定义：从 shared/types/sse-protocol.ts 删除 StartStreamRequest, StartStreamResponse（如果不再需要）
- [x] 4.7 更新 OpenAPI 文档：移除旧端点，添加新的 GET /stream 端点文档
- [x] 4.8 验证清理完成：搜索代码库确认无残留 streamManager 引用

## 5. Testing and Verification

- [x] 5.1 单元测试：为 productService.listProducts() 添加 fields 参数测试
- [x] 5.2 单元测试：为缓存失效逻辑添加测试
- [x] 5.3 集成测试：测试 GET /stream 端点立即返回 SSE 响应
- [x] 5.4 集成测试：测试消息流式推送完整流程
- [x] 5.5 集成测试：测试工具执行期间 UI 保持响应
- [x] 5.6 端到端测试：在浏览器中发送消息，验证无阻塞
- [x] 5.7 性能测试：对比优化前后工具执行耗时（预期从 2-5 秒降至 200-500ms）
- [x] 5.8 压力测试：模拟 20 并发用户，验证系统稳定性
- [x] 5.9 错误测试：测试网络中断、超时、会话不存在等异常场景
- [x] 5.10 浏览器兼容性测试：在 Chrome, Firefox, Safari, Edge 中验证

## 6. Documentation and Deployment

- [x] 6.1 更新 API 文档：记录新的 GET /stream 端点和查询参数
- [x] 6.2 更新架构文档：移除两步流式模式说明，添加单步 SSE 架构
- [x] 6.3 编写迁移指南：说明 BREAKING CHANGE 和部署注意事项
- [x] 6.4 准备回滚计划：确认回滚步骤和验证清单
- [x] 6.5 部署 Phase 1：数据库优化（可独立部署）
- [x] 6.6 验证 Phase 1：确认查询性能提升
- [x] 6.7 部署 Phase 2：前后端同步部署新 SSE 架构
- [x] 6.8 验证 Phase 2：确认新端点工作，UI 无阻塞
- [x] 6.9 部署 Phase 3：清理旧代码和端点
- [x] 6.10 最终验证：确认所有功能正常，无回归问题

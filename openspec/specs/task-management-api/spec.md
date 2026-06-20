# Task Management API Specification

## Purpose

This capability captures the accepted Chat redesign requirements synced from the chat-ui-redesign-v2 change.

## Requirements

### Requirement: 获取会话任务列表
系统SHALL提供GET /api/tasks/:sessionId接口，返回指定会话的所有任务。

#### Scenario: 成功获取任务列表
- **WHEN** 发送GET /api/tasks/:sessionId请求，sessionId有效
- **THEN** 返回200状态码和任务数组，按created_at降序排列

#### Scenario: 返回数据结构
- **WHEN** 成功返回任务列表
- **THEN** 每个任务包含id, sessionId, taskName, status, startTime, endTime, relatedProducts, platform, metadata, createdAt, updatedAt字段

#### Scenario: 空任务列表
- **WHEN** 会话没有任务
- **THEN** 返回200状态码和空数组[]

#### Scenario: 会话不存在
- **WHEN** sessionId不存在
- **THEN** 返回404状态码，错误消息"Session not found"

#### Scenario: 无权限访问
- **WHEN** 用户无权访问该会话
- **THEN** 返回403状态码，错误消息"Forbidden"

#### Scenario: 分页支持（可选）
- **WHEN** 请求包含limit和offset查询参数
- **THEN** 返回分页后的任务列表和总数total

### Requirement: 创建新任务
系统SHALL提供POST /api/tasks接口，创建新的任务记录。

#### Scenario: 成功创建任务
- **WHEN** 发送POST /api/tasks请求，包含有效的sessionId和taskName
- **THEN** 返回201状态码和新创建的任务对象，包含自动生成的id和时间戳

#### Scenario: 请求体验证
- **WHEN** 请求体缺少必填字段
- **THEN** 返回400状态码，错误消息列出缺失的字段

#### Scenario: sessionId验证
- **WHEN** sessionId不存在
- **THEN** 返回404状态码，错误消息"Session not found"

#### Scenario: 任务名称验证
- **WHEN** taskName为空或超过200字符
- **THEN** 返回400状态码，错误消息"Invalid task name"

#### Scenario: 状态初始值
- **WHEN** 创建任务时未指定status
- **THEN** 默认设为pending

#### Scenario: 开始时间自动设置
- **WHEN** 创建任务时未指定startTime
- **THEN** 自动设为当前时间戳

#### Scenario: 关联产品验证
- **WHEN** relatedProducts为JSON数组
- **THEN** 验证数组格式，非法则返回400

#### Scenario: 平台验证
- **WHEN** platform字段提供
- **THEN** 验证是否为支持的平台（amazon/shopify/其他），非法则返回400

### Requirement: 更新任务状态
系统SHALL提供PATCH /api/tasks/:id接口，更新任务的状态和相关字段。

#### Scenario: 成功更新任务
- **WHEN** 发送PATCH /api/tasks/:id请求，包含有效的更新字段
- **THEN** 返回200状态码和更新后的任务对象

#### Scenario: 任务不存在
- **WHEN** taskId不存在
- **THEN** 返回404状态码，错误消息"Task not found"

#### Scenario: 状态转换验证
- **WHEN** status从pending更新为completed
- **THEN** 接受更新，自动设置endTime为当前时间戳

#### Scenario: 非法状态转换
- **WHEN** status值不在允许的枚举中
- **THEN** 返回400状态码，错误消息"Invalid status value"

#### Scenario: 部分更新支持
- **WHEN** 请求体只包含部分字段（如只更新status）
- **THEN** 只更新提供的字段，其他字段保持不变

#### Scenario: updatedAt自动更新
- **WHEN** 任何字段更新成功
- **THEN** updatedAt自动设为当前时间戳

#### Scenario: endTime自动设置
- **WHEN** status更新为completed或failed
- **THEN** 如果endTime为空，自动设为当前时间戳

#### Scenario: metadata更新
- **WHEN** 更新metadata字段
- **THEN** 验证JSON格式，合并或替换现有metadata

### Requirement: Zod Schema验证
系统SHALL使用Zod定义请求体和响应的Schema，确保类型安全。

#### Scenario: 创建任务Schema
- **WHEN** 定义CreateTaskRequest Schema
- **THEN** 包含sessionId(string), taskName(string), status(enum), relatedProducts(array), platform(string)等字段，设置必填和可选

#### Scenario: 更新任务Schema
- **WHEN** 定义UpdateTaskRequest Schema
- **THEN** 所有字段为可选，允许部分更新

#### Scenario: 任务响应Schema
- **WHEN** 定义TaskResponse Schema
- **THEN** 包含完整的任务字段，id为必填，时间戳为number类型

#### Scenario: 验证失败响应
- **WHEN** 请求体不符合Schema
- **THEN** 返回400状态码，错误消息包含详细的验证失败信息（字段名和原因）

### Requirement: 数据库操作
系统SHALL使用Drizzle ORM操作task_overviews表，确保类型安全和事务支持。

#### Scenario: 插入任务记录
- **WHEN** 创建新任务
- **THEN** 使用db.insert(taskOverviews).values({...})插入记录

#### Scenario: 查询任务列表
- **WHEN** 获取会话任务
- **THEN** 使用db.select().from(taskOverviews).where(eq(taskOverviews.sessionId, sessionId))

#### Scenario: 更新任务记录
- **WHEN** 更新任务状态
- **THEN** 使用db.update(taskOverviews).set({...}).where(eq(taskOverviews.id, id))

#### Scenario: 事务支持
- **WHEN** 需要原子性操作（如创建任务+更新会话）
- **THEN** 使用db.transaction包裹多个操作

#### Scenario: 级联删除
- **WHEN** 会话被删除
- **THEN** 关联的任务自动删除（ON DELETE CASCADE）

### Requirement: 错误处理
系统SHALL统一处理API错误，返回一致的错误响应格式。

#### Scenario: 错误响应格式
- **WHEN** API返回错误
- **THEN** 响应体包含error对象，含message(string), code(string), details(object)字段

#### Scenario: 数据库错误处理
- **WHEN** 数据库操作失败
- **THEN** 捕获错误，返回500状态码，记录详细日志，返回通用错误消息

#### Scenario: 验证错误处理
- **WHEN** Zod验证失败
- **THEN** 返回400状态码，错误消息包含所有验证失败的字段

#### Scenario: 资源不存在错误
- **WHEN** 请求的资源不存在
- **THEN** 返回404状态码，明确指出哪个资源不存在

### Requirement: 日志记录
系统SHALL记录任务API的关键操作日志，便于调试和监控。

#### Scenario: 创建任务日志
- **WHEN** 成功创建任务
- **THEN** 记录info级别日志，包含sessionId, taskName, taskId

#### Scenario: 更新任务日志
- **WHEN** 更新任务状态
- **THEN** 记录info级别日志，包含taskId, 旧状态, 新状态

#### Scenario: 错误日志
- **WHEN** API操作失败
- **THEN** 记录error级别日志，包含请求信息、错误堆栈、用户ID

### Requirement: OpenAPI文档
系统SHALL在OpenAPI规范中定义任务管理API，生成Swagger文档。

#### Scenario: API路径定义
- **WHEN** OpenAPI文档
- **THEN** 包含/api/tasks/:sessionId, /api/tasks, /api/tasks/:id三个路径

#### Scenario: Schema定义
- **WHEN** OpenAPI文档
- **THEN** 定义TaskOverview, CreateTaskRequest, UpdateTaskRequest, TaskListResponse等Schema

#### Scenario: 响应示例
- **WHEN** OpenAPI文档
- **THEN** 每个端点包含成功和失败的响应示例

#### Scenario: 认证说明
- **WHEN** OpenAPI文档
- **THEN** 标注需要认证的端点，说明认证方式

### Requirement: 性能优化
系统SHALL优化任务查询的性能，支持高并发访问。

#### Scenario: 索引优化
- **WHEN** 查询会话任务
- **THEN** 使用idx_tasks_session索引加速查询

#### Scenario: 查询结果缓存（可选）
- **WHEN** 任务列表查询频繁
- **THEN** 使用Redis缓存查询结果，TTL 60秒

#### Scenario: 批量查询支持（可选）
- **WHEN** 需要查询多个会话的任务
- **THEN** 提供批量查询接口，减少数据库往返

### Requirement: 任务状态枚举
系统SHALL定义明确的任务状态枚举，确保状态值一致性。

#### Scenario: 状态枚举定义
- **WHEN** 定义任务状态
- **THEN** 允许的值为pending, in_progress, completed, failed, cancelled

#### Scenario: pending状态
- **WHEN** 任务刚创建或等待执行
- **THEN** 状态为pending

#### Scenario: in_progress状态
- **WHEN** 任务正在执行
- **THEN** 状态为in_progress

#### Scenario: completed状态
- **WHEN** 任务成功完成
- **THEN** 状态为completed，endTime非空

#### Scenario: failed状态
- **WHEN** 任务执行失败
- **THEN** 状态为failed，endTime非空，metadata可包含错误信息

#### Scenario: cancelled状态
- **WHEN** 用户手动取消任务
- **THEN** 状态为cancelled，endTime非空

### Requirement: 任务查询过滤（可选）
系统SHALL支持可选地按状态、时间范围等条件过滤任务。

#### Scenario: 按状态过滤
- **WHEN** 请求包含status查询参数
- **THEN** 只返回指定状态的任务

#### Scenario: 按时间范围过滤
- **WHEN** 请求包含startDate和endDate参数
- **THEN** 只返回在该时间范围内创建的任务

#### Scenario: 按平台过滤
- **WHEN** 请求包含platform参数
- **THEN** 只返回指定平台的任务

### Requirement: 任务统计接口（可选）
系统SHALL支持可选的任务统计接口，返回任务数量和状态分布。

#### Scenario: 会话任务统计
- **WHEN** 发送GET /api/tasks/:sessionId/stats请求
- **THEN** 返回任务总数和各状态的数量{total, pending, in_progress, completed, failed}

#### Scenario: 用户任务统计
- **WHEN** 发送GET /api/users/:userId/tasks/stats请求
- **THEN** 返回该用户所有会话的任务统计

### Requirement: 并发控制
系统SHALL处理任务状态更新的并发冲突，避免数据不一致。

#### Scenario: 乐观锁（可选）
- **WHEN** 使用updatedAt作为版本字段
- **THEN** 更新时检查updatedAt是否匹配，不匹配则返回409冲突

#### Scenario: 重复请求处理
- **WHEN** 短时间内收到相同的状态更新请求
- **THEN** 使用幂等性保证，第二次请求返回相同结果，不重复执行

### Requirement: 测试覆盖
系统SHALL为任务管理API编写完整的单元测试和集成测试。

#### Scenario: 单元测试覆盖
- **WHEN** 测试任务创建逻辑
- **THEN** 覆盖正常流程、验证失败、数据库错误等场景

#### Scenario: 集成测试覆盖
- **WHEN** 测试API端到端
- **THEN** 覆盖创建任务→更新状态→查询任务的完整流程

#### Scenario: 边界条件测试
- **WHEN** 测试边界输入
- **THEN** 覆盖空字符串、超长字符串、非法JSON等边界情况

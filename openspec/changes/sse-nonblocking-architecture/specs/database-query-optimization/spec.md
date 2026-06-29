# Database Query Optimization

## Purpose

定义数据库查询优化策略，减少 AI Agent 工具执行期间的数据库查询耗时，确保即使后台有数据库操作，前端也能保持流畅响应。

## ADDED Requirements

### Requirement: Product listing query limit reduction
系统 SHALL 减少 listProducts 查询的默认 limit，避免一次性加载过多数据。

#### Scenario: Reduce default limit from 1000 to 100
- **WHEN** agentTools.getAllProducts() 被调用
- **THEN** productService.listProducts() SHALL 使用 limit: 100 而非 1000

#### Scenario: Tool-specific limits
- **WHEN** 特定工具需要不同的数据量
- **THEN** 该工具 SHALL 显式指定 limit 参数，而非依赖默认值

#### Scenario: Pagination support
- **WHEN** AI 需要访问超过 100 个产品
- **THEN** 系统 SHALL 支持通过多次调用加载分页数据

### Requirement: Field selection in queries
系统 SHALL 支持指定查询字段，避免 SELECT * 带来的性能开销。

#### Scenario: Add fields parameter to listProducts
- **WHEN** productService.listProducts() 被调用
- **THEN** 接口 SHALL 支持可选的 fields 参数（字符串数组）

#### Scenario: Query only necessary fields
- **WHEN** fields 参数被指定
- **THEN** 数据库查询 SHALL 仅 SELECT 指定字段，而非所有列

#### Scenario: Default to all fields for backward compatibility
- **WHEN** fields 参数未指定
- **THEN** 系统 SHALL 查询所有字段（保持向后兼容）

#### Scenario: Essential fields for tools
- **WHEN** agentTools 调用 listProducts
- **THEN** SHALL 仅请求必要字段：['id', 'title', 'platform', 'currentPrice', 'currency', 'brand', 'category', 'isMonitoring']

### Requirement: Database indexing
系统 SHALL 确保高频查询字段已建立索引。

#### Scenario: Index on platform column
- **WHEN** 数据库初始化或迁移时
- **THEN** products 表 SHALL 在 platform 列上创建索引（如果不存在）

#### Scenario: Index on isMonitoring column
- **WHEN** 数据库初始化或迁移时
- **THEN** products 表 SHALL 在 isMonitoring 列上创建索引（如果不存在）

#### Scenario: Composite index for common filters
- **WHEN** 数据库初始化或迁移时
- **THEN** products 表 SHALL 创建 (platform, isMonitoring) 复合索引，优化常见筛选查询

### Requirement: Query result caching
系统 SHALL 对稳定的查询结果实施短期缓存，减少重复查询。

#### Scenario: In-memory cache for product list
- **WHEN** getAllProducts() 被连续调用（间隔 <30 秒）
- **THEN** 系统 SHALL 返回缓存结果，而非重新查询数据库

#### Scenario: Cache invalidation on product changes
- **WHEN** 产品被创建、更新或删除
- **THEN** 相关的查询缓存 SHALL 立即失效

#### Scenario: Cache TTL configuration
- **WHEN** 系统初始化时
- **THEN** 缓存 TTL SHALL 可通过环境变量配置（默认 30 秒）

### Requirement: Aggregation optimization
系统 SHALL 优化数据聚合操作，避免在 JavaScript 层进行大规模过滤和计算。

#### Scenario: Database-level filtering
- **WHEN** 工具需要筛选特定平台或价格范围的产品
- **THEN** 筛选条件 SHALL 在 SQL WHERE 子句中执行，而非在应用层过滤

#### Scenario: Database-level sorting
- **WHEN** 工具需要排序结果
- **THEN** 排序 SHALL 在 SQL ORDER BY 子句中执行，利用数据库索引

#### Scenario: Count queries optimization
- **WHEN** 工具需要统计数量而非获取具体数据
- **THEN** 系统 SHALL 使用 SELECT COUNT(*) 而非 SELECT * 后计算长度

### Requirement: Lazy loading for related data
系统 SHALL 延迟加载关联数据，仅在实际需要时查询。

#### Scenario: Price history on demand
- **WHEN** 工具调用 getProductDetails
- **THEN** price history SHALL 仅在 includeHistory=true 时查询

#### Scenario: Business signals on demand
- **WHEN** 工具需要产品的商业信号数据
- **THEN** 商业信号 SHALL 通过单独的查询获取，而非默认 JOIN

#### Scenario: Alert rules lazy loading
- **WHEN** 工具列出产品
- **THEN** alert rules SHALL 不包含在默认查询中，除非明确请求

### Requirement: Query performance monitoring
系统 SHALL 记录慢查询，便于识别性能瓶颈。

#### Scenario: Log slow queries
- **WHEN** 数据库查询耗时超过 500ms
- **THEN** 系统 SHALL 记录警告日志，包含 SQL、参数、耗时

#### Scenario: Query timing in tool execution
- **WHEN** 工具执行包含数据库查询
- **THEN** tool_complete 事件 SHALL 包含查询耗时统计

#### Scenario: Aggregate query statistics
- **WHEN** 开发或调试模式
- **THEN** 系统 SHALL 提供查询统计端点，显示平均耗时、最慢查询等

### Requirement: Connection pool optimization
系统 SHALL 优化数据库连接池配置，提高并发查询性能。

#### Scenario: Connection pool size
- **WHEN** 系统初始化数据库连接
- **THEN** 连接池大小 SHALL 设置为 CPU 核心数 * 2（默认最小 5，最大 20）

#### Scenario: Connection timeout
- **WHEN** 获取连接时
- **THEN** 超时时间 SHALL 设置为 5000ms，避免无限等待

#### Scenario: Idle connection cleanup
- **WHEN** 连接空闲超过 30 秒
- **THEN** 连接池 SHALL 自动回收，释放资源

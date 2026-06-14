## 1. 类型定义

- [x] 1.1 在 backend/src/types/index.ts 中添加 PriceSnapshot 接口
- [x] 1.2 在 backend/src/types/index.ts 中添加 CreatePriceSnapshotData 接口

## 2. 服务层实现

- [x] 2.1 创建 backend/src/services/priceSnapshotService.ts 文件
- [x] 2.2 实现 PriceSnapshotService 类的 createSnapshot 方法
- [x] 2.3 实现 PriceSnapshotService 类的 getSnapshotsByProduct 方法（支持 limit 参数）
- [x] 2.4 实现 PriceSnapshotService 类的 getLatestSnapshot 方法

## 3. 服务层测试

- [x] 3.1 创建 backend/tests/priceSnapshotService.test.ts 文件
- [x] 3.2 编写 createSnapshot 方法的单元测试（必填字段、可选字段）
- [x] 3.3 编写 getSnapshotsByProduct 方法的单元测试（全部快照、limit 参数、排序验证）
- [x] 3.4 编写 getLatestSnapshot 方法的单元测试（存在快照、不存在快照）
- [x] 3.5 运行测试确保全部通过

## 4. API 路由实现

- [x] 4.1 创建 backend/src/routes/priceSnapshots.ts 文件
- [x] 4.2 实现 POST /api/price-snapshots 端点（创建快照）
- [x] 4.3 实现 GET /api/price-snapshots/product/:productId 端点（查询历史）
- [x] 4.4 实现 GET /api/price-snapshots/product/:productId/latest 端点（获取最新）
- [x] 4.5 在 backend/src/routes/index.ts 中注册 /price-snapshots 路由

## 5. API 集成测试

- [x] 5.1 创建 backend/tests/priceSnapshots.api.test.ts 文件
- [x] 5.2 编写 POST /api/price-snapshots 的集成测试（成功创建、缺少必填字段）
- [x] 5.3 编写 GET /api/price-snapshots/product/:productId 的集成测试（返回全部、limit 参数、排序）
- [x] 5.4 编写 GET /api/price-snapshots/product/:productId/latest 的集成测试（成功返回、404）
- [x] 5.5 运行集成测试确保全部通过

## 6. 集成验证

- [x] 6.1 运行所有测试（npm test）确保 100% 通过
- [x] 6.2 启动服务器（npm run dev）验证 API 端点可访问
- [x] 6.3 手动测试完整流程（创建快照 → 查询历史 → 获取最新）

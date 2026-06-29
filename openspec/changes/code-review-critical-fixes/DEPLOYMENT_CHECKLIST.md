# Code Review Critical Fixes - 部署检查清单

## 部署前验证

### 1. 代码质量
- [ ] 运行 ESLint 并修复所有警告
- [ ] 运行 TypeScript 编译器检查类型错误
- [ ] 移除所有 console.log 和调试代码
- [ ] 验证没有 TODO 注释残留

### 2. 测试覆盖
- [ ] 运行所有单元测试并确保通过
- [ ] 运行 E2E 测试并确保通过
- [ ] 运行冒烟测试并确保 <2 分钟完成
- [ ] 验证测试覆盖率 ≥90% (新代码)

### 3. 功能验证
- [ ] SSE 连接在长时间工具执行期间保持活跃（15s 心跳）
- [ ] 客户端断开时流立即中止
- [ ] 双击发送按钮不会创建重复消息
- [ ] 快速 Enter 按键不会创建重复消息
- [ ] 后端拒绝 5 秒内的重复内容
- [ ] getAllProducts 返回完整的 Product 对象（包含 updatedAt, asin, productUrl）
- [ ] 产品更新只失效该平台的缓存（不是全局清除）
- [ ] 组件卸载时取消 RAF 定时器
- [ ] 数据库索引仅在迁移中定义（不在应用启动代码中）

### 4. 性能指标
- [ ] SSE 首字节延迟 < 500ms
- [ ] 缓存命中率 >70%（混合读写负载）
- [ ] getAllProducts 95th 百分位延迟 < 100ms
- [ ] 100 并发 SSE 连接无内存泄漏

### 5. 错误处理
- [ ] SSE 连接超时后正确中止（10 分钟）
- [ ] 网络错误时 UI 显示友好错误消息
- [ ] 429 错误正确显示重复请求提示

## Staging 部署步骤

### 1. 准备
```bash
# 创建特性分支
git checkout -b fix/code-review-critical-fixes

# 提交所有更改
git add .
git commit -m "fix: 修复代码审查发现的 10 个关键 bug

- SSE 连接生命周期管理（心跳、中止、超时）
- 请求去重（前端 + 后端）
- 产品查询类型契约修复
- 细粒度缓存失效
- RAF 定时器清理
- 数据库索引去重
- 工具过滤优化
- 协议签名一致性

Co-Authored-By: Claude Code <noreply@anthropic.com>"

# 推送到远程
git push -u origin fix/code-review-critical-fixes
```

### 2. 创建 Pull Request
- PR 标题: `fix: 修复代码审查发现的 10 个关键 bug`
- 链接到 OpenSpec 变更: `openspec/changes/code-review-critical-fixes`
- 包含测试结果截图
- 列出所有修复的 bug

### 3. 部署到 Staging
```bash
# 合并到 staging 分支
git checkout staging
git merge fix/code-review-critical-fixes
git push origin staging

# 触发 staging 部署
# (根据你的 CI/CD 配置)
```

### 4. Staging 验证
- [ ] 运行冒烟测试 against staging: `node backend/src/scripts/smoke-test.js`
- [ ] 手动测试关键流程
- [ ] 监控 staging 24 小时
  - [ ] 内存使用稳定（无增长趋势）
  - [ ] SSE 连接成功率 >99%
  - [ ] 错误率 <0.1%
  - [ ] 响应时间无退化

### 5. 负载测试
```bash
# 使用 Artillery 或类似工具
artillery quick --count 100 --num 10 http://staging-backend/api/chat/sessions/new/stream?content=test
```
- [ ] 验证无内存泄漏
- [ ] 验证连接正常关闭
- [ ] 验证心跳正常工作

## 生产部署步骤

### 1. 最终检查
- [ ] 所有 staging 验证通过
- [ ] PR 获得批准
- [ ] 所有 CI 检查通过
- [ ] 回滚方案就绪

### 2. 合并到主分支
```bash
git checkout main
git merge fix/code-review-critical-fixes
git push origin main
```

### 3. 渐进式发布
- **10% 流量** (30 分钟)
  - [ ] 监控错误率
  - [ ] 监控 SSE 连接成功率
  - [ ] 监控内存使用

- **50% 流量** (1 小时)
  - [ ] 验证缓存命中率改善
  - [ ] 验证无重复消息
  - [ ] 验证 RAF 清理无警告

- **100% 流量** (2 小时)
  - [ ] 全量监控所有指标
  - [ ] 验证所有修复正常工作

### 4. 回滚方案
如果发现问题：
```bash
# 立即回滚
git revert <commit-hash>
git push origin main

# 或者切换到之前的版本
git checkout <previous-stable-commit>
git push -f origin main
```

## 监控指标

### SSE 连接
- 连接成功率 (目标: >99%)
- 平均连接时长
- 心跳发送频率 (目标: 15s)
- 连接中止次数

### 缓存性能
- 缓存命中率 (目标: >70%)
- 缓存失效次数
- 按平台失效的准确性

### 内存使用
- 应用内存稳定性（无增长趋势）
- RAF 定时器泄漏（应为 0）
- SSE 连接清理（应及时）

### 错误率
- 重复请求被拒绝 (429) 次数
- SSE 超时次数
- 类型错误（undefined 访问）次数

## 紧急联系

如果发现严重问题：
1. 立即回滚
2. 通知团队
3. 记录问题详情
4. 更新此检查清单

## 完成确认

部署完成后：
- [ ] 所有监控指标正常
- [ ] 无用户报告的问题
- [ ] 归档此变更: `/opsx:archive`

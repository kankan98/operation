# 性能优化指南

> 性能指标和优化策略

---

## 1. 性能指标

### 核心指标

| 指标 | 目标值 | 测量工具 |
|------|--------|---------|
| 首次内容绘制 (FCP) | < 1.8s | Lighthouse |
| 可交互时间 (TTI) | < 3.8s | Lighthouse |
| 滚动帧率 | 60fps | DevTools |
| 事件处理时长 | < 16.67ms | DevTools |
| Bundle 大小 | < 200KB | Bundle Analyzer |

### 自定义目标

- 滚动事件处理：≤ 16.67ms（60fps）
- API 响应时间：< 200ms
- 页面切换：< 300ms
- 动画流畅度：60fps

---

## 2. 优化检查清单

### 事件处理优化

- [ ] 使用防抖/节流处理高频事件
- [ ] 使用 `requestAnimationFrame` 处理滚动/动画
- [ ] 避免在事件处理器中进行昂贵计算
- [ ] 最小化 DOM 查询次数

**示例**：
```typescript
// ❌ 错误
const handleScroll = () => {
  const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
  setUserScrolledUp(distance > 200);
};

// ✅ 正确：使用 RAF 节流
const handleScroll = useCallback(() => {
  if (rafRef.current) return;
  rafRef.current = requestAnimationFrame(() => {
    rafRef.current = null;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    setUserScrolledUp(distance > 200);
  });
}, []);
```

### React 性能优化

- [ ] 使用 `React.memo` 避免不必要的重渲染
- [ ] 使用 `useCallback` 缓存回调函数
- [ ] 使用 `useMemo` 缓存计算结果
- [ ] 使用 `useRef` 存储不触发渲染的数据
- [ ] 避免在渲染路径中进行昂贵计算

### DOM 操作优化

- [ ] 批量 DOM 更新
- [ ] 使用 `DocumentFragment` 构建复杂结构
- [ ] 避免频繁读取会触发回流的属性
- [ ] 缓存 DOM 查询结果

### Bundle 优化

- [ ] 使用代码分割（Code Splitting）
- [ ] 使用动态导入（Dynamic Import）
- [ ] Tree Shaking 移除未使用代码
- [ ] 压缩和混淆代码
- [ ] 使用 CDN 加载第三方库

---

## 3. 性能测量工具

### Chrome DevTools Performance

**步骤**：
1. 打开 DevTools → Performance
2. 录制操作
3. 停止录制
4. 分析火焰图

**关注指标**：
- FPS：是否稳定在 60fps
- Main 线程：是否有长任务（>50ms）
- 事件处理时长：是否 <16.67ms

### React DevTools Profiler

**用途**：识别不必要的重渲染

**步骤**：
1. 打开 React DevTools → Profiler
2. 录制操作
3. 查看组件重渲染情况

### Lighthouse

**用途**：整体性能评估

**步骤**：
1. 打开 DevTools → Lighthouse
2. 选择性能测试
3. 生成报告
4. 根据建议优化

---

## 4. 常见性能问题

### 问题 1：滚动卡顿

**原因**：事件处理过于频繁、昂贵计算、频繁 DOM 查询

**解决**：
- 使用 RAF 节流
- 缓存 DOM 查询结果
- 避免重布局

### 问题 2：列表渲染慢

**原因**：渲染大量列表项、每个列表项都重新渲染

**解决**：
- 使用虚拟滚动（react-window/react-virtualized）
- 使用 `React.memo` 避免不必要重渲染
- 使用 `key` 优化列表渲染

### 问题 3：首次加载慢

**原因**：Bundle 过大、同步加载所有资源

**解决**：
- 代码分割
- 动态导入非关键模块
- 懒加载图片和组件
- 使用 CDN

### 问题 4：动画不流畅

**原因**：使用 JavaScript 动画、触发回流/重绘

**解决**：
- 优先使用 CSS 动画
- 使用 `transform` 和 `opacity`
- 使用 `will-change` 提示浏览器
- 使用 RAF 同步动画

---

## 5. 后台任务管理

| 任务类型 | 是否后台 | 理由 |
|---------|---------|------|
| 开发服务器 | ✅ | 长期运行 |
| 构建任务 | ❌ | 需要结果 |
| 依赖安装（大型） | ✅ | 可能很慢 |
| 单元测试 | ❌ | 快速执行 |
| E2E 测试（长时间） | ✅ | 数分钟 |
| 浏览器下载 | ✅ | 时间不确定 |

**优先级**：
1. **关键路径任务** - 前台运行
2. **并行任务** - 后台运行
3. **验证任务** - 前台运行

---

## 核心原则

1. **测量优先** - 先测量，后优化，避免过早优化
2. **关键路径优化** - 优先优化用户感知最强的部分
3. **RAF 节流** - 处理高频事件（滚动、resize）
4. **缓存优化** - useCallback/useMemo/React.memo
5. **后台任务** - 长时间任务后台运行

记住：**过早优化是万恶之源**，但**忽视性能同样危险**。

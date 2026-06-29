## ADDED Requirements

### Requirement: 自动滚动仅在流式完成后执行
自动滚动到最新消息 SHALL 仅在消息列表稳定后执行，避免流式传输期间的频繁滚动。

#### Scenario: 流式传输期间不滚动
- **WHEN** 消息正在流式传输，messages.length 频繁变化
- **THEN** 不触发自动滚动，避免滚动抖动

#### Scenario: 流式完成后滚动
- **WHEN** isStreaming 状态从 true 变为 false
- **THEN** 执行一次平滑滚动到最新消息

#### Scenario: 新消息到达时滚动
- **WHEN** 新消息添加到列表且不在流式传输状态
- **THEN** 平滑滚动到新消息位置

### Requirement: 使用 useCallback 稳定滚动回调
滚动相关的回调函数 SHALL 使用 useCallback 优化，避免不必要的重新创建。

#### Scenario: tasks 数组更新不触发回调重建
- **WHEN** tasks 数组因任务状态更新而变化
- **THEN** handleViewTaskDetail 回调使用 useRef 或事件参数获取最新 tasks，避免闭包陷阱

#### Scenario: 滚动回调传递给子组件
- **WHEN** 滚动回调传递给 TaskPanel 子组件
- **THEN** 回调引用保持稳定，子组件不因回调变化而重新渲染

### Requirement: scrollIntoView 包含异常保护
scrollIntoView 操作 SHALL 包含 try-catch 保护，防止元素已卸载时抛出异常。

#### Scenario: 元素卸载时滚动失败
- **WHEN** 用户触发滚动但目标元素在执行前被卸载
- **THEN** 捕获 DOMException，不影响 UI 稳定性

#### Scenario: 元素存在时正常滚动
- **WHEN** 用户触发滚动且目标元素存在于 DOM
- **THEN** 平滑滚动到目标元素，居中显示

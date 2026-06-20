# Chat Layout Specification

## MODIFIED Requirements

### Requirement: 4栏Grid布局替代2栏Flexbox
系统SHALL使用CSS Grid实现4栏布局，替代原有的2栏Flexbox布局。

#### Scenario: Grid布局结构
- **WHEN** Chat页面渲染
- **THEN** 使用grid布局，grid-template-columns: 208px 272px minmax(720px, 1fr) 314px，高度100vh

#### Scenario: 主导航栏列
- **WHEN** Grid第一列
- **THEN** 固定宽度208px，背景#ffffff，右边框1px solid #e7e8ee

#### Scenario: 会话列表列
- **WHEN** Grid第二列
- **THEN** 固定宽度272px，背景#ffffff，右边框1px solid #e7e8ee

#### Scenario: 对话区列
- **WHEN** Grid第三列
- **THEN** 弹性宽度minmax(720px, 1fr)，背景#fcfcfd，无边框

#### Scenario: 任务面板列
- **WHEN** Grid第四列
- **THEN** 固定宽度314px，背景#ffffff，左边框1px solid #e7e8ee

### Requirement: 响应式断点适配
系统SHALL根据视口宽度调整布局列数和显示方式。

#### Scenario: Desktop布局（≥1024px）
- **WHEN** 视口宽度≥1024px
- **THEN** 显示完整4栏布局，所有列可见

#### Scenario: Tablet布局（768-1023px）
- **WHEN** 视口宽度在768-1023px
- **THEN** 主导航和任务面板可通过按钮切换显示，会话列表和对话区始终可见

#### Scenario: Mobile布局（<768px）
- **WHEN** 视口宽度<768px
- **THEN** 单栏布局，通过tab或drawer切换不同区域

#### Scenario: Tablet主导航切换
- **WHEN** Tablet模式下点击hamburger按钮
- **THEN** 主导航以overlay形式从左侧滑入，带backdrop

#### Scenario: Tablet任务面板切换
- **WHEN** Tablet模式下点击任务面板按钮
- **THEN** 任务面板以drawer形式从右侧滑入

### Requirement: 最小尺寸约束
系统SHALL设置最小视口尺寸，防止布局崩溃。

#### Scenario: 最小宽度
- **WHEN** 视口宽度<768px（Mobile）
- **THEN** 允许单栏布局，无最小宽度限制

#### Scenario: Desktop最小宽度
- **WHEN** Desktop模式
- **THEN** 最小宽度1280px，防止4栏挤压

#### Scenario: 最小高度
- **WHEN** 任何模式
- **THEN** 最小高度820px，防止内容截断

### Requirement: 布局溢出处理
系统SHALL正确处理各列的内容溢出，启用独立滚动。

#### Scenario: 主导航滚动
- **WHEN** 导航项超过视口高度
- **THEN** 主导航区域独立滚动，overflow-y: auto

#### Scenario: 会话列表滚动
- **WHEN** 会话数量超过视口高度
- **THEN** 会话列表区域独立滚动

#### Scenario: 对话区滚动
- **WHEN** 消息内容超过视口高度
- **THEN** 对话区域独立滚动，保持输入框固定在底部

#### Scenario: 任务面板滚动
- **WHEN** 任务内容超过视口高度
- **THEN** 任务面板区域独立滚动

### Requirement: 组件重构路径
系统SHALL创建新的Chat组件，保留旧版Chat组件以支持回退。

#### Scenario: Chat组件创建
- **WHEN** 创建新版聊天页面
- **THEN** 新建Chat.tsx文件，实现4栏布局

#### Scenario: 旧版保留
- **WHEN** Chat创建后
- **THEN** Chat.tsx保持不变，继续支持2栏布局

#### Scenario: 组件目录分离
- **WHEN** 创建新版组件
- **THEN** 新组件放在components/chat/目录，旧组件保留在components/chat/

#### Scenario: 路由配置
- **WHEN** 配置路由
- **THEN** /chat指向Chat，/chat指向Chat（旧版）

### Requirement: 布局动画过渡
系统SHALL为布局变化添加平滑的过渡动画。

#### Scenario: 列展开/折叠动画
- **WHEN** Tablet模式下切换主导航或任务面板
- **THEN** 使用250ms ease-out过渡，transform translateX

#### Scenario: 响应式切换动画
- **WHEN** 视口宽度跨越断点
- **THEN** 布局平滑过渡，避免闪烁

### Requirement: 布局性能优化
系统SHALL优化4栏布局的渲染性能。

#### Scenario: GPU加速
- **WHEN** 渲染布局
- **THEN** 使用transform和opacity实现动画，触发GPU加速

#### Scenario: 防止布局抖动
- **WHEN** 内容加载
- **THEN** 使用固定宽度列，防止布局shift

#### Scenario: 虚拟滚动（可选）
- **WHEN** 会话或消息列表超过100项
- **THEN** 使用虚拟滚动技术优化性能

## ADDED Requirements

### Requirement: 主导航区域新增
系统SHALL在最左侧新增208px宽的主导航栏。

#### Scenario: 主导航渲染
- **WHEN** Chat页面加载
- **THEN** 第一列渲染MainNavigation组件

#### Scenario: 主导航内容
- **WHEN** MainNavigation渲染
- **THEN** 包含品牌Logo、导航项列表、用户区

### Requirement: 任务面板区域新增
系统SHALL在最右侧新增314px宽的任务面板。

#### Scenario: 任务面板渲染
- **WHEN** Chat页面加载
- **THEN** 第四列渲染TaskPanel组件

#### Scenario: 任务面板内容
- **WHEN** TaskPanel渲染
- **THEN** 包含TaskOverviewCard和ToolExecutionCard组件

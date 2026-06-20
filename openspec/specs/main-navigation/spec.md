# Main Navigation Specification

## Purpose

This capability captures the accepted Chat redesign requirements synced from the chat-ui-redesign-v2 change.

## Requirements

### Requirement: 主导航栏布局结构
系统SHALL提供固定宽度208px的主导航栏，包含品牌区、导航项列表和底部用户区三个区域。

#### Scenario: 主导航栏渲染
- **WHEN** 用户访问任何聊天页面
- **THEN** 主导航栏固定在页面最左侧，宽度为208px，高度占满视口

#### Scenario: 导航栏区域划分
- **WHEN** 主导航栏渲染完成
- **THEN** 顶部显示品牌区（Logo + 名称），中间显示导航项列表，底部显示用户区

### Requirement: 品牌区显示
系统SHALL在主导航栏顶部显示品牌Logo（32x32px紫色圆角方块）和产品名称"跨境运营助手"。

#### Scenario: 品牌Logo渲染
- **WHEN** 主导航栏加载
- **THEN** 品牌区显示32x32px的紫色渐变圆角Logo（圆角9px），背景渐变从#7c5cff到#6e54ee

#### Scenario: 品牌名称显示
- **WHEN** 品牌区渲染
- **THEN** Logo右侧显示"跨境运营助手"文本，字体15px/700，颜色#111827

#### Scenario: 副标题显示
- **WHEN** 品牌名称下方
- **THEN** 显示"AI 智能运营"副标题，字体12px，颜色#8b93a3

### Requirement: 导航项列表
系统SHALL显示5个主导航项：仪表盘、商品、预警、智能助手、设置，每项高度40px，支持active状态高亮。

#### Scenario: 导航项渲染
- **WHEN** 主导航栏加载
- **THEN** 按顺序显示：仪表盘、商品、预警、智能助手、设置五个导航项，每项高度40px，间距8px

#### Scenario: 导航项默认样式
- **WHEN** 导航项未被选中
- **THEN** 显示18px灰色图标（#667085），文本14px/500/颜色#667085，背景透明

#### Scenario: 导航项hover状态
- **WHEN** 鼠标悬停在导航项上
- **THEN** 背景变为浅紫色#f4f1ff，图标和文字颜色变为#6e54ee

#### Scenario: 导航项active状态
- **WHEN** 当前路由匹配导航项
- **THEN** 导航项背景为#f4f1ff，图标和文字颜色为#6e54ee，圆角9px

### Requirement: 智能助手导航选中
系统SHALL在聊天页面时默认选中"智能助手"导航项，显示active状态样式。

#### Scenario: 聊天页面默认选中
- **WHEN** 用户在/chat或/chat路由
- **THEN** "智能助手"导航项显示active状态（浅紫背景+紫色文字图标）

#### Scenario: 切换到其他模块
- **WHEN** 用户点击其他导航项（如"仪表盘"）
- **THEN** "智能助手"取消active状态，被点击的导航项变为active

### Requirement: 导航项图标规范
系统SHALL为每个导航项使用Lucide图标库的线性图标，stroke宽度1.5px，尺寸18px。

#### Scenario: 图标选择
- **WHEN** 渲染导航项
- **THEN** 仪表盘使用LayoutDashboard，商品使用Package，预警使用Bell，智能助手使用MessageSquare，设置使用Settings

#### Scenario: 图标样式
- **WHEN** 渲染图标
- **THEN** 图标尺寸18px，stroke宽度1.5px，颜色跟随导航项状态（默认#667085，active/hover为#6e54ee）

### Requirement: 底部用户区
系统SHALL在主导航栏底部显示用户信息和账户操作入口。

#### Scenario: 用户区渲染
- **WHEN** 主导航栏加载完成
- **THEN** 底部固定显示用户头像、用户名和下拉菜单图标

#### Scenario: 用户头像显示
- **WHEN** 用户区渲染
- **THEN** 显示32px圆形头像，使用用户上传的头像或默认紫色渐变占位符

#### Scenario: 用户名显示
- **WHEN** 用户头像右侧
- **THEN** 显示用户名，字体13px/500，颜色#111827，最大宽度120px，超出省略

### Requirement: 导航项点击路由跳转
系统SHALL在用户点击导航项时跳转到对应的路由。

#### Scenario: 点击仪表盘
- **WHEN** 用户点击"仪表盘"导航项
- **THEN** 路由跳转到/dashboard

#### Scenario: 点击商品
- **WHEN** 用户点击"商品"导航项
- **THEN** 路由跳转到/products

#### Scenario: 点击预警
- **WHEN** 用户点击"预警"导航项
- **THEN** 路由跳转到/alerts

#### Scenario: 点击智能助手
- **WHEN** 用户点击"智能助手"导航项
- **THEN** 路由跳转到/chat

#### Scenario: 点击设置
- **WHEN** 用户点击"设置"导航项
- **THEN** 路由跳转到/settings

### Requirement: 响应式适配
系统SHALL在不同屏幕尺寸下适配主导航栏的显示方式。

#### Scenario: Desktop显示（≥1024px）
- **WHEN** 视口宽度≥1024px
- **THEN** 主导航栏固定显示，宽度208px，始终可见

#### Scenario: Tablet显示（768-1023px）
- **WHEN** 视口宽度在768-1023px之间
- **THEN** 主导航栏可通过hamburger按钮切换显示/隐藏，显示时为overlay模式

#### Scenario: Mobile显示（<768px）
- **WHEN** 视口宽度<768px
- **THEN** 主导航栏默认隐藏，通过hamburger按钮切换为全屏overlay

### Requirement: 导航栏样式规范
系统SHALL遵循设计系统的颜色、间距、圆角规范。

#### Scenario: 背景和边框
- **WHEN** 主导航栏渲染
- **THEN** 背景色为#ffffff，右侧1px边框颜色#e7e8ee

#### Scenario: 内边距和间距
- **WHEN** 主导航栏渲染
- **THEN** 左右内边距16px，顶部内边距20px，品牌区下方间距32px

#### Scenario: 导航项圆角
- **WHEN** 导航项active或hover
- **THEN** 圆角为9px

### Requirement: 动画过渡效果
系统SHALL为导航项的状态切换添加平滑的过渡动画。

#### Scenario: hover过渡
- **WHEN** 鼠标悬停或离开导航项
- **THEN** 背景色和文字颜色以160ms ease过渡

#### Scenario: active切换过渡
- **WHEN** 导航项active状态变化
- **THEN** 背景色和文字颜色以160ms ease过渡

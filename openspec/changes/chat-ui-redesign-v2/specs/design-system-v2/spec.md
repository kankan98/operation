# Design System V2 Specification

## ADDED Requirements

### Requirement: 新紫色主色调
系统SHALL使用#6E54EE作为新的主品牌色，替换旧的#8B5CF6。

#### Scenario: 主色定义
- **WHEN** 定义CSS变量
- **THEN** --color-primary设为#6e54ee

#### Scenario: hover色定义
- **WHEN** 交互元素hover状态
- **THEN** --color-primary-hover设为#5f46df

#### Scenario: active色定义
- **WHEN** 交互元素active状态
- **THEN** --color-primary-active设为#523cc8

#### Scenario: 浅紫背景色
- **WHEN** 需要浅紫色背景
- **THEN** --color-primary-soft设为#f4f1ff

#### Scenario: 极浅紫背景色
- **WHEN** 需要更浅的紫色背景
- **THEN** --color-primary-softer设为#f8f6ff

#### Scenario: 紫色边框
- **WHEN** 需要紫色边框
- **THEN** --color-primary-border设为#a891ff

#### Scenario: 紫色focus ring
- **WHEN** 元素获得焦点
- **THEN** --color-primary-ring设为rgba(110, 84, 238, 0.18)

### Requirement: 页面背景色系统
系统SHALL定义清晰的背景色层级，用于不同的UI层次。

#### Scenario: 页面背景
- **WHEN** body或主容器背景
- **THEN** --color-page设为#fcfcfd

#### Scenario: 表面背景
- **WHEN** 卡片、面板等表面元素
- **THEN** --color-surface设为#ffffff

#### Scenario: subtle表面
- **WHEN** 需要略微区分的表面
- **THEN** --color-surface-subtle设为#fafafa

#### Scenario: muted表面
- **WHEN** 需要更明显区分的表面
- **THEN** --color-surface-muted设为#f7f7fb

#### Scenario: 面板背景
- **WHEN** 独立面板（侧边栏、对话框）
- **THEN** --color-panel设为#ffffff

### Requirement: 文字颜色层级
系统SHALL定义四级文字颜色，用于不同的信息层级。

#### Scenario: 主文字颜色
- **WHEN** 标题、正文等主要内容
- **THEN** --color-text设为#111827

#### Scenario: 次级文字颜色
- **WHEN** 描述、辅助说明
- **THEN** --color-text-secondary设为#4b5563

#### Scenario: 弱化文字颜色
- **WHEN** 标签、时间戳
- **THEN** --color-text-muted设为#7b8494

#### Scenario: 极弱化文字颜色
- **WHEN** placeholder、禁用状态
- **THEN** --color-text-faint设为#a0a7b6

#### Scenario: 紫色背景上的文字
- **WHEN** 文字在紫色背景上
- **THEN** --color-on-primary设为#ffffff

### Requirement: 边框颜色系统
系统SHALL定义三级边框颜色，用于不同的分割场景。

#### Scenario: 标准边框
- **WHEN** 卡片、输入框等默认边框
- **THEN** --color-border设为#e7e8ee

#### Scenario: 柔和边框
- **WHEN** 需要更柔和的分割线
- **THEN** --color-border-soft设为#eff0f4

#### Scenario: 强调边框
- **WHEN** 需要强调的边框
- **THEN** --color-border-strong设为#d8dbe5

### Requirement: 语义颜色系统
系统SHALL定义成功、警告、危险、信息四类语义颜色及其变体。

#### Scenario: 成功主色
- **WHEN** 成功状态提示
- **THEN** --color-success设为#22c55e

#### Scenario: 成功浅色背景
- **WHEN** 成功状态背景
- **THEN** --color-success-soft设为#ecfdf3

#### Scenario: 成功边框
- **WHEN** 成功状态边框
- **THEN** --color-success-border设为#86efac

#### Scenario: 警告主色
- **WHEN** 警告状态提示
- **THEN** --color-warning设为#f59e0b

#### Scenario: 警告浅色背景
- **WHEN** 警告状态背景
- **THEN** --color-warning-soft设为#fff7ed

#### Scenario: 危险主色
- **WHEN** 错误、危险状态
- **THEN** --color-danger设为#ef4444

#### Scenario: 危险浅色背景
- **WHEN** 危险状态背景
- **THEN** --color-danger-soft设为#fef2f2

#### Scenario: 信息主色
- **WHEN** 信息提示
- **THEN** --color-info设为#3b82f6

#### Scenario: 信息浅色背景
- **WHEN** 信息状态背景
- **THEN** --color-info-soft设为#eff6ff

### Requirement: 阴影分级系统
系统SHALL定义xs/sm/md三级阴影和primary阴影，用于不同的elevation。

#### Scenario: xs级阴影
- **WHEN** 轻微的卡片阴影
- **THEN** --shadow-xs设为0 1px 2px rgba(15, 23, 42, 0.04)

#### Scenario: sm级阴影
- **WHEN** 常规卡片阴影
- **THEN** --shadow-sm设为0 4px 10px rgba(15, 23, 42, 0.05)

#### Scenario: md级阴影
- **WHEN** 浮层、对话框阴影
- **THEN** --shadow-md设为0 12px 28px rgba(15, 23, 42, 0.08)

#### Scenario: primary紫色阴影
- **WHEN** 紫色按钮等主要交互元素
- **THEN** --shadow-primary设为0 8px 20px rgba(110, 84, 238, 0.24)

### Requirement: 字体系统
系统SHALL定义字体家族和7级字体大小。

#### Scenario: 无衬线字体栈
- **WHEN** 定义sans-serif字体
- **THEN** --font-sans设为"Inter", "PingFang SC", "Microsoft YaHei", "Noto Sans SC", system-ui, sans-serif

#### Scenario: 等宽字体栈
- **WHEN** 代码、函数名显示
- **THEN** --font-mono设为"JetBrains Mono", "Fira Code", ui-monospace, monospace

#### Scenario: 2xs字体
- **WHEN** 极小文字（徽章数字）
- **THEN** --text-2xs设为11px

#### Scenario: xs字体
- **WHEN** 小文字（时间戳、标签）
- **THEN** --text-xs设为12px

#### Scenario: sm字体
- **WHEN** 辅助文字（说明、caption）
- **THEN** --text-sm设为13px

#### Scenario: base字体
- **WHEN** 正文默认大小
- **THEN** --text-base设为14px

#### Scenario: md字体
- **WHEN** 略大的正文
- **THEN** --text-md设为15px

#### Scenario: lg字体
- **WHEN** 小标题
- **THEN** --text-lg设为16px

#### Scenario: xl字体
- **WHEN** 标题
- **THEN** --text-xl设为18px

### Requirement: 行高系统
系统SHALL定义三级行高，用于不同的文字密度。

#### Scenario: 紧凑行高
- **WHEN** 标题、按钮文字
- **THEN** --leading-tight设为1.25

#### Scenario: 正常行高
- **WHEN** 正文、列表
- **THEN** --leading-normal设为1.55

#### Scenario: 宽松行高
- **WHEN** 长文本、引用
- **THEN** --leading-relaxed设为1.7

### Requirement: 间距系统
系统SHALL遵循8pt网格系统，定义7级间距。

#### Scenario: 1级间距
- **WHEN** 最小间距
- **THEN** --space-1设为4px

#### Scenario: 2级间距
- **WHEN** 小间距
- **THEN** --space-2设为8px

#### Scenario: 3级间距
- **WHEN** 标准间距
- **THEN** --space-3设为12px

#### Scenario: 4级间距
- **WHEN** 常用间距
- **THEN** --space-4设为16px

#### Scenario: 5级间距
- **WHEN** 中等间距
- **THEN** --space-5设为20px

#### Scenario: 6级间距
- **WHEN** 较大间距
- **THEN** --space-6设为24px

#### Scenario: 8级间距
- **WHEN** 大间距
- **THEN** --space-8设为32px

### Requirement: 圆角系统
系统SHALL定义6级圆角，用于不同的组件类型。

#### Scenario: xs圆角
- **WHEN** 小元素（徽章、chip）
- **THEN** --radius-xs设为6px

#### Scenario: sm圆角
- **WHEN** 按钮、导航项
- **THEN** --radius-sm设为8px

#### Scenario: md圆角
- **WHEN** 输入框、小卡片
- **THEN** --radius-md设为10px

#### Scenario: lg圆角
- **WHEN** 大卡片、消息气泡
- **THEN** --radius-lg设为12px

#### Scenario: xl圆角
- **WHEN** 大型工具卡片
- **THEN** --radius-xl设为16px

#### Scenario: full圆角
- **WHEN** 圆形头像、chip
- **THEN** --radius-full设为999px

### Requirement: Tailwind配置同步
系统SHALL将所有设计token同步到tailwind.config.js，支持utility class使用。

#### Scenario: 颜色token同步
- **WHEN** Tailwind配置
- **THEN** extend.colors包含所有--color-*变量映射

#### Scenario: 间距token同步
- **WHEN** Tailwind配置
- **THEN** extend.spacing包含所有--space-*变量映射

#### Scenario: 圆角token同步
- **WHEN** Tailwind配置
- **THEN** extend.borderRadius包含所有--radius-*变量映射

#### Scenario: 阴影token同步
- **WHEN** Tailwind配置
- **THEN** extend.boxShadow包含所有--shadow-*变量映射

### Requirement: 动画时序系统
系统SHALL定义标准的动画时长和缓动函数。

#### Scenario: 快速动画
- **WHEN** hover、focus状态变化
- **THEN** 150ms ease-out

#### Scenario: 标准动画
- **WHEN** 展开/折叠、淡入淡出
- **THEN** 200ms ease-out

#### Scenario: 慢速动画
- **WHEN** 页面切换、drawer滑入
- **THEN** 250ms ease-out

#### Scenario: 自定义缓动
- **WHEN** 需要更柔和的缓动
- **THEN** --ease-out-soft设为cubic-bezier(0.16, 1, 0.3, 1)

### Requirement: 状态透明度系统
系统SHALL定义交互状态的透明度值。

#### Scenario: hover状态透明度
- **WHEN** 元素hover
- **THEN** --state-hover-opacity设为0.08

#### Scenario: active状态透明度
- **WHEN** 元素active
- **THEN** --state-active-opacity设为0.12

#### Scenario: disabled状态透明度
- **WHEN** 元素禁用
- **THEN** --state-disabled-opacity设为0.38

#### Scenario: focus ring
- **WHEN** 元素获得焦点
- **THEN** --state-focus-ring设为0 0 0 3px rgba(139, 92, 246, 0.1)

### Requirement: 临时兼容层
系统SHALL保留临时的legacy-purple变量，便于过渡期使用。

#### Scenario: legacy purple定义
- **WHEN** 定义兼容变量
- **THEN** --color-legacy-purple设为#8B5CF6

#### Scenario: legacy purple使用注释
- **WHEN** 使用legacy purple
- **THEN** 代码注释标记"// TODO: 迁移到新purple，30天后移除"

#### Scenario: 30天后移除
- **WHEN** 上线30天后
- **THEN** 移除所有--color-legacy-purple相关代码

### Requirement: 设计token文档
系统SHALL提供完整的设计token文档，方便开发者查阅。

#### Scenario: 颜色色板展示
- **WHEN** 访问设计系统文档页面
- **THEN** 展示所有颜色token及其HEX值和使用场景

#### Scenario: 间距可视化
- **WHEN** 查看间距系统
- **THEN** 可视化展示各级间距的实际大小

#### Scenario: 组件样式示例
- **WHEN** 查看组件规范
- **THEN** 展示按钮、卡片等组件的标准样式和变体

### Requirement: 色彩对比度验证
系统SHALL确保所有颜色组合符合WCAG AA标准（对比度≥4.5:1）。

#### Scenario: 主文字对比度
- **WHEN** 主文字(#111827)在白色背景(#ffffff)
- **THEN** 对比度≥4.5:1

#### Scenario: 紫色按钮对比度
- **WHEN** 白色文字(#ffffff)在紫色背景(#6e54ee)
- **THEN** 对比度≥4.5:1

#### Scenario: 对比度测试工具
- **WHEN** 新增颜色组合
- **THEN** 使用工具验证对比度，未达标则调整

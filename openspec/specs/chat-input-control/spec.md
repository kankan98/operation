# chat-input-control

## Purpose

管理聊天输入框的状态和交互行为，确保输入框使用 React 受控组件模式，避免直接 DOM 操作导致的状态不一致问题。

## Requirements

### Requirement: 聊天输入框使用受控组件模式
聊天输入框 SHALL 使用 React 受控组件模式管理输入状态，而非直接操作 DOM。

#### Scenario: 用户输入文本
- **WHEN** 用户在输入框中输入文本
- **THEN** 输入值通过 React state 管理，组件重新渲染时保持输入内容

#### Scenario: 快捷按钮填充输入
- **WHEN** 用户点击欢迎页的快捷操作按钮
- **THEN** 按钮文本通过 setState 填充到输入框，而非直接修改 textarea.value

#### Scenario: 组件重新渲染后保持输入
- **WHEN** 组件因其他状态变化重新渲染
- **THEN** 输入框内容不会丢失或被清空

### Requirement: 使用 ref 访问输入框元素
组件 SHALL 使用 useRef hook 访问输入框 DOM 元素，用于聚焦等操作。

#### Scenario: 快捷按钮触发聚焦
- **WHEN** 用户点击快捷操作按钮填充内容后
- **THEN** 输入框自动获得焦点

#### Scenario: 提交后清空输入
- **WHEN** 用户提交消息后
- **THEN** 输入框清空并准备接收新输入

### Requirement: 表单提交验证
表单 SHALL 在提交前验证输入内容非空。

#### Scenario: 提交空白消息
- **WHEN** 用户提交仅包含空格的消息
- **THEN** 消息不发送，输入框保持当前内容

#### Scenario: 提交有效消息
- **WHEN** 用户提交包含文本的消息
- **THEN** 消息发送到服务器，输入框清空

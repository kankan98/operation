## ADDED Requirements

### Requirement: 空输入提交按钮状态
聊天输入表单 SHALL 在输入内容为空或仅包含空白字符时禁用发送按钮，并阻止键盘提交。

#### Scenario: 空输入禁用发送
- **WHEN** 聊天输入框为空
- **THEN** 发送按钮处于 disabled 状态

#### Scenario: 空白字符禁用发送
- **WHEN** 聊天输入框只包含空格、换行或制表符
- **THEN** 发送按钮处于 disabled 状态

#### Scenario: Enter 不提交空白消息
- **WHEN** 用户在空白输入框中按 Enter
- **THEN** 系统不创建会话、不发送网络请求、不清空输入框

#### Scenario: 有效输入启用发送
- **WHEN** 聊天输入框包含至少一个非空白字符
- **THEN** 发送按钮处于 enabled 状态

### Requirement: 换行与发送键盘行为一致
聊天输入框 SHALL 保持 Enter 发送、Shift+Enter 换行的行为，并且该行为必须与按钮 disabled 状态一致。

#### Scenario: Shift Enter 插入换行
- **WHEN** 用户在输入框中按 Shift+Enter
- **THEN** 系统在输入框当前位置插入换行，不发送消息

#### Scenario: Enter 发送有效消息
- **WHEN** 用户输入有效消息并按 Enter
- **THEN** 系统提交消息并清空输入框

#### Scenario: Streaming 时阻止重复提交
- **WHEN** 当前会话正在流式生成回复
- **THEN** 输入框和发送按钮不可用，Enter 不会触发第二次提交

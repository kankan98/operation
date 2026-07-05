## ADDED Requirements

### Requirement: 消息反馈操作提供可见结果
系统 SHALL 确保 assistant 消息上的反馈按钮点击后产生可见状态或被隐藏。

#### Scenario: 点赞显示选中状态
- **WHEN** 用户点击 assistant 消息的点赞按钮
- **THEN** 点赞按钮显示选中状态，点踩按钮显示未选中状态

#### Scenario: 点踩显示选中状态
- **WHEN** 用户点击 assistant 消息的点踩按钮
- **THEN** 点踩按钮显示选中状态，点赞按钮显示未选中状态

#### Scenario: 再次点击清除反馈
- **WHEN** 用户再次点击已选中的反馈按钮
- **THEN** 系统清除该消息的反馈状态

#### Scenario: 反馈持久化不可用时不误导
- **WHEN** 当前没有后端反馈持久化接口
- **THEN** 系统仅表现为本地会话状态，或隐藏反馈按钮

### Requirement: 更多操作按钮只在有菜单时显示
系统 SHALL 只在存在可用命令菜单时显示 assistant 消息的“更多操作”按钮。

#### Scenario: 没有更多命令时隐藏按钮
- **WHEN** assistant 消息没有可执行的更多命令
- **THEN** 系统不显示“更多操作”按钮

#### Scenario: 有更多命令时打开菜单
- **WHEN** assistant 消息存在更多命令且用户点击“更多操作”
- **THEN** 系统显示包含可执行命令的菜单

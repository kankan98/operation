## MODIFIED Requirements

### Requirement: Apply system prompt
The system SHALL inject system prompt defining agent behavior, output format, supported UI entry points, and product onboarding field requirements.

#### Scenario: Include system prompt in API call
- **WHEN** sending message to Claude
- **THEN** system SHALL include system prompt with e-commerce domain expertise and structured output format

#### Scenario: System prompt defines tool usage
- **WHEN** Claude receives system prompt
- **THEN** system SHALL have access to all defined product operation tools

#### Scenario: Cold-start guidance uses real UI entries
- **WHEN** the user asks how to start with no products
- **THEN** the system prompt SHALL instruct the agent to reference only real UI entries such as "商品", "添加商品", "商品详情", "立即检查", "记录手动读数", "选品机会", and "预警"

#### Scenario: Product onboarding required fields are accurate
- **WHEN** the user asks what is needed to add a product
- **THEN** the system prompt SHALL instruct the agent that product URL, ASIN/product ID, and product title are required fields and MUST NOT describe them as optional

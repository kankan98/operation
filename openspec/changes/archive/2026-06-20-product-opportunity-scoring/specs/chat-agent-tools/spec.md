## ADDED Requirements

### Requirement: Define opportunity ranking tool
The system SHALL provide a Chat agent tool that returns ranked product opportunities using the opportunity scoring service.

#### Scenario: Ask for best opportunities
- **WHEN** the user asks which products deserve attention or investigation
- **THEN** the agent MAY call the opportunity ranking tool and SHALL return ranked products with score, confidence, recommendation, and key reasons

#### Scenario: Apply opportunity filters
- **WHEN** the agent calls the opportunity ranking tool with platform, minimum score, recommendation, or limit parameters
- **THEN** the tool SHALL return only matching ranked opportunities

#### Scenario: No opportunities
- **WHEN** no products match the opportunity filters
- **THEN** the tool SHALL return an empty list with a concise explanation

### Requirement: Define opportunity explanation tool
The system SHALL provide a Chat agent tool that explains a single product opportunity score.

#### Scenario: Explain product score
- **WHEN** the user asks why a product is or is not a good opportunity
- **THEN** the agent MAY call the opportunity explanation tool and SHALL return score, confidence, factor breakdown, missing signals, and recommended action

#### Scenario: Missing signal explanation
- **WHEN** the score confidence is reduced because signals are missing
- **THEN** the tool SHALL identify missing signals and suggest data collection actions such as running a manual check

### Requirement: Avoid unsupported opportunity claims in Chat
The Chat agent SHALL avoid claiming profit, demand, or sales certainty when the scoring inputs do not contain those signals.

#### Scenario: Profit signal missing
- **WHEN** opportunity scoring lacks cost, fee, shipping, or sales data
- **THEN** the Chat explanation SHALL state that profit or demand cannot yet be verified from available data

## ADDED Requirements

### Requirement: Explain opportunity research state in Chat
The Chat agent tools SHALL be able to read and explain opportunity research workspace state.

#### Scenario: Explain shortlisted product
- **WHEN** the agent explains a product that has research metadata
- **THEN** the tool SHALL return research status, priority, tags, notes summary, and last updated timestamp alongside score and signal caveats

#### Scenario: Explain product without research entry
- **WHEN** the agent explains a product that is not in the research workspace
- **THEN** the tool SHALL state that no shortlist or research metadata exists for that product

### Requirement: List shortlisted opportunities in Chat
The Chat agent tools SHALL provide a read-only path for listing shortlisted opportunity candidates.

#### Scenario: List active shortlist
- **WHEN** the user asks for shortlisted or saved opportunities
- **THEN** the agent MAY call the read-only shortlist tool and SHALL return products with score, recommendation, research status, tags, priority, and key caveats

#### Scenario: Filter shortlist by status or tag
- **WHEN** the agent calls the shortlist tool with status or tag filters
- **THEN** the tool SHALL return only matching non-archived research entries

### Requirement: Avoid hidden research mutations in Chat
The Chat agent SHALL NOT mutate opportunity research state without an explicit write workflow.

#### Scenario: User asks for analysis
- **WHEN** the user asks the assistant to compare or explain shortlisted opportunities
- **THEN** the agent SHALL read existing research state without adding, removing, retagging, or archiving entries

#### Scenario: User asks to save an item
- **WHEN** the user asks Chat to save, tag, or archive an opportunity
- **THEN** the agent SHALL explain that the current tool can summarize research state but direct mutation must be done through the workspace UI until an explicit write tool exists

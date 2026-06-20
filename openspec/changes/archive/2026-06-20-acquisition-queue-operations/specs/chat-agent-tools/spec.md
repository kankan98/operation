## ADDED Requirements

### Requirement: Explain acquisition queue status in Chat
The Chat agent tools SHALL provide a read-only path for explaining acquisition queue and worker health.

#### Scenario: Explain healthy queue
- **WHEN** the user asks whether acquisition is running normally
- **THEN** the agent MAY call the queue health tool and SHALL summarize backend, backlog, worker health, provider gates, and caveat

#### Scenario: Explain delayed product job
- **WHEN** the user asks why a product has not refreshed
- **THEN** the agent SHALL explain the product job state, retry timing, worker state, provider gates, and latest acquisition attempt without starting a hidden refresh

#### Scenario: Explain provider gate
- **WHEN** queue health shows provider rate-limit or quota gating
- **THEN** the agent SHALL identify the affected provider/platform and suggest operational remediation such as checking credentials, quota, reset time, or concurrency settings

### Requirement: Avoid hidden queue mutations in Chat
The Chat agent SHALL NOT retry, cancel, reprioritize, or enqueue acquisition jobs without an explicit write workflow.

#### Scenario: User asks for diagnosis
- **WHEN** the user asks why data is stale, missing, delayed, or degraded
- **THEN** the agent SHALL read queue and attempt state without mutating jobs

#### Scenario: User asks to retry from Chat
- **WHEN** the user asks Chat to retry or cancel a job
- **THEN** the agent SHALL explain that the current Chat tool is read-only and direct job control must use the operations UI/API until an explicit confirmation workflow exists

### Requirement: Distinguish queue operations from opportunity signals in Chat
Chat explanations SHALL keep queue health separate from market, business, and opportunity evidence.

#### Scenario: Queue degraded while product score is high
- **WHEN** queue health is degraded for a high-scoring product
- **THEN** Chat SHALL explain that acquisition operations are degraded but SHALL NOT lower or reinterpret the product opportunity score as demand, sales, or profit evidence

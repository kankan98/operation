## ADDED Requirements

### Requirement: Preserve first setup guide across anchor navigation
The product detail UI SHALL preserve the first-research setup guide during same-page setup navigation until the user explicitly dismisses it.

#### Scenario: Keep guide after manual reading anchor navigation
- **WHEN** product detail is opened with first-setup route state and the user activates the guide action for the manual reading section
- **THEN** the first-research setup guide SHALL remain visible and its remaining setup actions SHALL still be available

#### Scenario: Keep guide after business assumptions anchor navigation
- **WHEN** product detail is opened with first-setup route state and the user activates the guide action for the business assumptions section
- **THEN** the first-research setup guide SHALL remain visible and its remaining setup actions SHALL still be available

#### Scenario: Dismiss still hides guide
- **WHEN** the guide remains visible after same-page anchor navigation and the user dismisses it
- **THEN** the first-research setup guide SHALL be hidden for the current detail-page session

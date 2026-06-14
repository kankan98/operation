## ADDED Requirements

### Requirement: Validate product URLs
The system SHALL validate product URLs match the specified platform format.

#### Scenario: Validate Amazon URL
- **WHEN** validating an Amazon product URL
- **THEN** system SHALL accept URLs matching pattern https://amazon.com/dp/{ASIN}

#### Scenario: Validate Walmart URL
- **WHEN** validating a Walmart product URL
- **THEN** system SHALL accept URLs matching pattern https://walmart.com/ip/{id}

#### Scenario: Reject invalid URL format
- **WHEN** validating a malformed URL
- **THEN** system SHALL return false

#### Scenario: Reject mismatched platform
- **WHEN** validating a Walmart URL with platform set to amazon
- **THEN** system SHALL return false

### Requirement: Validate email addresses
The system SHALL validate email address format.

#### Scenario: Valid email format
- **WHEN** validating a well-formed email address
- **THEN** system SHALL return true

#### Scenario: Invalid email format
- **WHEN** validating malformed email (missing @, no domain, etc.)
- **THEN** system SHALL return false

### Requirement: Validate platform names
The system SHALL validate platform names against supported list.

#### Scenario: Supported platform
- **WHEN** validating platform name from supported list (amazon, walmart, aliexpress, ebay, lazada, other)
- **THEN** system SHALL return true

#### Scenario: Unsupported platform
- **WHEN** validating unknown platform name
- **THEN** system SHALL return false

### Requirement: Sanitize string input
The system SHALL remove dangerous characters from string input.

#### Scenario: Remove script tags
- **WHEN** sanitizing input containing <script> tags
- **THEN** system SHALL remove all script tags and their contents

#### Scenario: Limit string length
- **WHEN** sanitizing input longer than maxLength
- **THEN** system SHALL truncate to maxLength characters

### Requirement: Validate positive numbers
The system SHALL validate that numeric values are positive.

#### Scenario: Valid positive number
- **WHEN** validating a positive number
- **THEN** system SHALL return true

#### Scenario: Invalid number
- **WHEN** validating zero, negative number, or non-numeric value
- **THEN** system SHALL return false

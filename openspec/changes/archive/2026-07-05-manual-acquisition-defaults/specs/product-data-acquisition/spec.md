## ADDED Requirements

### Requirement: Default acquisition to explicit manual checks
Product data acquisition SHALL default to explicit user-triggered single-product checks in manual-first installations.

#### Scenario: Manual single-product check remains available
- **WHEN** a user explicitly requests acquisition for one product
- **THEN** the system SHALL attempt acquisition through the configured provider chain and preserve snapshot source, attempt history, and job diagnostics

#### Scenario: Bulk monitoring acquisition requires opt-in
- **WHEN** the system is running with manual-first default configuration
- **THEN** it SHALL NOT enqueue acquisition jobs for all monitored products unless bulk acquisition is explicitly enabled

#### Scenario: Disabled bulk acquisition preserves existing data
- **WHEN** bulk monitoring acquisition is disabled
- **THEN** the system SHALL NOT delete existing jobs, attempts, snapshots, products, alerts, or research metadata

#### Scenario: Manual readings remain the preferred data path
- **WHEN** automated provider acquisition is unavailable, blocked, or disabled
- **THEN** the product workflow SHALL keep manual price readings available as the preferred data path for user-observed evidence

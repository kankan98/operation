## ADDED Requirements

### Requirement: Settings category navigation
The system SHALL organize settings into categories: General, Account, Integrations, Notifications, Billing, API, and Team.

#### Scenario: Settings sidebar navigation
- **WHEN** user views Settings module
- **THEN** system displays secondary sidebar or tab navigation with categories: General, Account, Integrations, Notifications, Billing, API, Team

#### Scenario: Category selection
- **WHEN** user clicks settings category
- **THEN** system displays corresponding settings panel and highlights active category in navigation

### Requirement: Integration cards
The system SHALL display available and connected integrations as cards with logo and connection status.

#### Scenario: Integration card display
- **WHEN** user views Integrations section
- **THEN** system displays cards for each integration: Amazon, Shopify, eBay, TikTok Shop, Google Ads, Meta Ads
- **THEN** each card shows integration logo, name, connection status badge, and action button

#### Scenario: Connected integration status
- **WHEN** integration is connected
- **THEN** system displays green Success badge with "Connected" label
- **THEN** system shows "Manage" or "Disconnect" action button

#### Scenario: Disconnected integration status
- **WHEN** integration is not connected
- **THEN** system displays neutral badge with "Not Connected" label
- **THEN** system shows "Connect" action button

#### Scenario: Integration connection flow
- **WHEN** user clicks "Connect" button on integration card
- **THEN** system initiates OAuth flow or displays API key input modal for that integration

### Requirement: General settings
The system SHALL provide general settings for language, timezone, date format, and currency.

#### Scenario: Language preference
- **WHEN** user views General settings
- **THEN** system displays language selector dropdown with Chinese and English options
- **WHEN** user changes language
- **THEN** system updates interface language immediately

#### Scenario: Timezone configuration
- **WHEN** user selects timezone from dropdown
- **THEN** system updates all date/time displays throughout platform to use selected timezone

#### Scenario: Currency preference
- **WHEN** user selects currency (USD, CNY, EUR, GBP, etc.)
- **THEN** system displays all monetary values in selected currency throughout platform

### Requirement: Account settings
The system SHALL provide account management including profile, password, and two-factor authentication.

#### Scenario: Profile editing
- **WHEN** user views Account settings
- **THEN** system displays editable fields for name, email, avatar upload
- **WHEN** user updates profile information
- **THEN** system saves changes and displays success confirmation

#### Scenario: Password change
- **WHEN** user initiates password change
- **THEN** system requires current password, new password, and confirmation
- **THEN** system validates password strength and displays requirements

#### Scenario: Two-factor authentication setup
- **WHEN** user enables 2FA
- **THEN** system displays QR code for authenticator app and backup codes
- **WHEN** 2FA is enabled
- **THEN** system displays green badge indicating "2FA Enabled"

### Requirement: Notification preferences
The system SHALL allow users to configure notification preferences by channel and event type.

#### Scenario: Notification channels
- **WHEN** user views Notification settings
- **THEN** system displays toggle switches for Email, In-App, and SMS notification channels

#### Scenario: Event-based notification control
- **WHEN** user views notification preferences
- **THEN** system displays toggles for notification types: Critical Alerts, Inventory Warnings, Sales Reports, Product Performance, AI Insights
- **WHEN** user disables specific notification type
- **THEN** system stops sending notifications for that event type across all channels

### Requirement: Team management
The system SHALL provide team member management with role-based access control.

#### Scenario: Team member list
- **WHEN** user with admin role views Team settings
- **THEN** system displays table of team members showing name, email, role, and status

#### Scenario: Invite team member
- **WHEN** admin clicks "Invite Member" button
- **THEN** system displays modal with email input and role selector (Admin, Manager, Analyst, Viewer)
- **WHEN** admin sends invitation
- **THEN** system sends invitation email and adds pending member to team list

#### Scenario: Role modification
- **WHEN** admin changes team member's role
- **THEN** system updates permissions immediately and notifies affected user

#### Scenario: Remove team member
- **WHEN** admin removes team member
- **THEN** system displays confirmation dialog, revokes access upon confirmation, and removes from team list

### Requirement: API configuration
The system SHALL provide API key management and webhook configuration.

#### Scenario: API key display
- **WHEN** user views API settings
- **THEN** system displays existing API keys with name, created date, last used date, and masked key value

#### Scenario: Generate API key
- **WHEN** user clicks "Generate New Key" button
- **THEN** system creates API key, displays full key value once with copy button and warning about not showing again
- **WHEN** user closes dialog
- **THEN** system masks the key permanently

#### Scenario: Revoke API key
- **WHEN** user clicks revoke on API key
- **THEN** system displays confirmation dialog and immediately invalidates key upon confirmation

### Requirement: Settings persistence
The system SHALL immediately save setting changes and provide visual feedback.

#### Scenario: Auto-save behavior
- **WHEN** user modifies any setting
- **THEN** system automatically saves change within 1 second
- **THEN** system displays subtle success indicator (e.g., "Saved" text or checkmark animation)

#### Scenario: Error handling
- **WHEN** setting save fails
- **THEN** system displays error message and allows user to retry
- **THEN** system reverts UI to previous value until save succeeds

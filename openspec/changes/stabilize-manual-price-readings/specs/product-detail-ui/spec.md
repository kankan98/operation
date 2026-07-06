## ADDED Requirements

### Requirement: Preserve manual reading input across failed saves
The product detail UI SHALL preserve entered manual reading values when saving fails and SHALL clear them only after the backend confirms the reading was saved.

#### Scenario: Failed manual reading save keeps entered values
- **WHEN** a user enters price, availability, BSR, rating, review count, or recorded date and the manual reading save fails
- **THEN** the form SHALL keep the entered values visible and show an accessible failure message

#### Scenario: Successful manual reading save clears retry fields
- **WHEN** a manual reading save succeeds
- **THEN** the form SHALL clear the entered reading fields so the user can enter the next observation

#### Scenario: User can retry after failed manual reading save
- **WHEN** a failed manual reading save has preserved the entered values
- **THEN** submitting the form again SHALL send the preserved values without requiring the user to retype them

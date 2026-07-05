## ADDED Requirements

### Requirement: Record manual reading from product list
The product list UI SHALL allow users to record a manual price reading directly from a product card without navigating to the product detail page.

#### Scenario: Open quick reading dialog from product card
- **WHEN** a user clicks the record-reading action on a product card
- **THEN** the system SHALL open a dialog scoped to that product with fields for price, availability, optional BSR, optional rating, optional review count, and optional recorded date

#### Scenario: Save manual reading from product list
- **WHEN** the user submits a valid quick reading from the product list
- **THEN** the frontend SHALL create a price snapshot with `source: 'manual'`, the product currency, and the entered fields

#### Scenario: Refresh product card after manual reading
- **WHEN** the quick reading is saved successfully
- **THEN** the product list SHALL refresh so the card reflects the updated current price and freshness state without a manual browser refresh

#### Scenario: Preserve list scanning density
- **WHEN** the product grid is shown
- **THEN** the quick reading entry point SHALL appear as a compact action and SHALL NOT expand the full reading form inline inside each card

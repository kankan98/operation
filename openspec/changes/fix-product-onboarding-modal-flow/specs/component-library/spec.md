## ADDED Requirements

### Requirement: Modal supports long content
The component library SHALL render modal dialogs with a fixed visible header and a scrollable body when content is taller than the viewport.

#### Scenario: Long content remains reachable
- **WHEN** a modal contains form content taller than the available viewport height
- **THEN** the modal body SHALL scroll internally instead of clipping content outside the dialog
- **THEN** the modal header SHALL remain visible

#### Scenario: Modal actions do not obscure content
- **WHEN** a form inside a modal renders validation errors or other dynamic content
- **THEN** action buttons SHALL NOT overlap required fields or validation messages

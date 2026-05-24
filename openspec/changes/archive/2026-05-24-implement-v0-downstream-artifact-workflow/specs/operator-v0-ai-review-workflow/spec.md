## ADDED Requirements

### Requirement: AI review V0 exposes accepted sections for downstream creation
The `/ai-review` browser workflow SHALL expose downstream creation affordances only for accepted or edited AI review sections whose section type maps to a supported downstream artifact.

#### Scenario: Accepted talk-track section is eligible
- **WHEN** a generated `talk_track_candidate` or `short_video_topic` section has review state accepted or edited
- **THEN** `/ai-review` SHALL show an operator-facing action to create a downstream talk-track draft reference and SHALL keep the action disabled for pending, rejected, or regeneration-requested sections

#### Scenario: Accepted next-action section is eligible
- **WHEN** a generated `next_session_action` section has review state accepted or edited
- **THEN** `/ai-review` SHALL show an operator-facing action to create a downstream task draft reference and SHALL keep the action disabled for pending, rejected, or regeneration-requested sections

#### Scenario: Downstream reference updates run state
- **WHEN** downstream reference creation succeeds for an accepted AI review section
- **THEN** `/ai-review` SHALL refresh the run detail, show the run as downstream-ready where returned by the API, and avoid claiming that a published talk track or completed task exists until the downstream workbench saves it

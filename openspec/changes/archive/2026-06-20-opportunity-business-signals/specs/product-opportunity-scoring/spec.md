## ADDED Requirements

### Requirement: Use business metrics in opportunity scoring
The opportunity scoring service SHALL use assumption-based business metrics as scoring factors when enough inputs exist.

#### Scenario: Score with complete business metrics
- **WHEN** a product has complete business assumptions and computed margin/ROI metrics
- **THEN** the scoring result SHALL include business factors for net margin, ROI, breakeven distance, and contribution profit in the factor breakdown

#### Scenario: Preserve deterministic scoring with business metrics
- **WHEN** the same product, price history, acquisition history, and business assumptions are scored repeatedly
- **THEN** the scoring service SHALL return the same score, confidence, factor breakdown, missing signals, and recommendation

#### Scenario: Avoid favorable scoring from missing costs
- **WHEN** business assumptions are incomplete
- **THEN** the scoring service SHALL mark missing business signals and SHALL NOT treat missing cost, fee, shipping, advertising, or tax fields as zero-cost advantages

### Requirement: Adjust scoring confidence for business completeness
The opportunity scoring service SHALL adjust confidence based on whether business assumptions are sufficient for margin and ROI analysis.

#### Scenario: Increase confidence from complete assumptions
- **WHEN** a product has complete business assumptions and valid derived metrics
- **THEN** scoring confidence SHALL reflect that margin and ROI signals are available

#### Scenario: Reduce confidence from missing assumptions
- **WHEN** required business assumptions are missing
- **THEN** scoring confidence SHALL remain reduced and missing signals SHALL identify the absent assumptions

### Requirement: Recommend actions from business metrics
The opportunity scoring service SHALL incorporate business metrics into recommended actions without replacing data-health recommendations.

#### Scenario: Recommend investigate for strong metrics
- **WHEN** a product has healthy acquisition data, sufficient confidence, positive net margin, and ROI above the configured investigation threshold
- **THEN** the recommended action MAY be `investigate` and the explanation SHALL cite the assumption-based metrics

#### Scenario: Recommend ignore for weak metrics
- **WHEN** a product has complete assumptions but negative net margin or ROI below the configured ignore threshold
- **THEN** the recommended action MAY be `ignore` and the explanation SHALL cite the weak business metrics

#### Scenario: Recommend check data for incomplete metrics
- **WHEN** business assumptions are incomplete and other scoring signals cannot justify a high-confidence recommendation
- **THEN** the recommended action MAY be `check_data` and the explanation SHALL identify the missing business assumptions

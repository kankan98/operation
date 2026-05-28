# production-access-transport-gate Specification

## Purpose
Define the provider-free production access and HTTPS transport readiness gate
that must be planned before a controlled real-data V1 trial can move into
runtime implementation.
## Requirements
### Requirement: Production access transport gate is deterministic
The system SHALL derive a production access and HTTPS transport gate from
accepted project status without calling external providers, reading secrets,
probing DNS, provisioning TLS, or creating new persistence.

#### Scenario: Gate detail is available from V1 planning
- **WHEN** the V1 production gate is in planning state
- **THEN** the system SHALL return a production access transport assessment with
  an overall stage, headline, summary, access section, transport section, current
  blockers, next implementation wave, and safe supporting evidence

#### Scenario: Gate detail remains conservative
- **WHEN** production login provider, public login route, invitation/team
  switching, domain, TLS, and production transport runtime are not implemented
  and verified
- **THEN** the assessment SHALL keep controlled real trial blocked and SHALL NOT
  mark the production access or HTTPS transport runtime as passed

#### Scenario: Gate output is safe
- **WHEN** the production access transport assessment is serialized or rendered
- **THEN** it SHALL NOT include API keys, cookies, session references, database
  URLs, provider payloads, raw prompts, raw transcripts, customer private data,
  stack traces, ACME account secrets, DNS credentials, or production tokens

### Requirement: Production access gate defines auth prerequisites
The production access section SHALL define the minimum production authentication
and team-access prerequisites needed before real operational data is allowed.

#### Scenario: Access prerequisites are listed
- **WHEN** the access gate section is built
- **THEN** it SHALL include provider decision, public login/callback route,
  session lifecycle, invitation or initial team access, team switching,
  role/permission enforcement, CSRF/origin protection, and admin recovery
  prerequisites

#### Scenario: Existing local auth runtime is supporting evidence only
- **WHEN** the project has local guard, app-owned sessions, secure-by-default
  cookie helpers, logout route, public trial route gate, and protected local-only
  Route Handler consumers
- **THEN** the access gate MAY show those as supporting evidence but SHALL still
  block real data until production login, account lifecycle, invitation/team
  access, and verification are implemented

#### Scenario: Provider selection remains explicit
- **WHEN** a production auth implementation is proposed later
- **THEN** it SHALL compare provider options against ownership, deployment,
  team-management, invitation, session, data-boundary, reachability, cost,
  rollback, and verification criteria before installing provider SDKs or
  creating public login routes

### Requirement: HTTPS transport gate defines deployment prerequisites
The HTTPS transport section SHALL define the minimum domain, TLS, secure-cookie,
and preview/production separation prerequisites needed before production access
can be opened.

#### Scenario: Transport prerequisites are listed
- **WHEN** the transport gate section is built
- **THEN** it SHALL include domain ownership, DNS/control path, TLS certificate
  issuance/renewal, HTTP-to-HTTPS redirect, secure cookie enforcement,
  production origin configuration, preview exception removal, and rollback
  prerequisites

#### Scenario: HTTP preview is not production transport
- **WHEN** the current public preview is available through an HTTP IP address
  with the internal V0 insecure preview cookie exception enabled
- **THEN** the transport gate SHALL identify it as preview-only supporting
  evidence and SHALL keep real data entry blocked

#### Scenario: Secure cookies depend on HTTPS
- **WHEN** production login or session runtime is planned
- **THEN** the transport gate SHALL require HTTPS-origin access before production
  cookies are treated as production-safe

### Requirement: Production access transport UI is compact and actionable
The overview and `/trial` readiness cockpit SHALL render production access and
HTTPS gate detail in a compact internal status surface when the V1 production
gate panel is available.

#### Scenario: Detailed gate renders in existing cockpit
- **WHEN** a verified evaluator opens the overview or `/trial` cockpit and V1
  production gate detail is available
- **THEN** the UI SHALL show access and transport sections with short Chinese
  labels, current state, next action, and top blockers using existing workspace
  styles

#### Scenario: UI avoids implementation leakage
- **WHEN** the production access transport surface renders
- **THEN** it SHALL avoid provider marketing copy, OpenSpec jargon, secrets,
  raw runtime config, stack traces, raw protected records, and long technical
  explanations in normal user-facing copy

#### Scenario: UI remains usable on desktop and mobile
- **WHEN** the detailed gate renders in desktop or mobile viewport
- **THEN** it SHALL avoid incoherent overlap, horizontal overflow, unstable card
  sizing, and text that cannot be scanned by Chinese operations users

### Requirement: Production access transport verification is provider-free
The project SHALL verify production access and HTTPS gate behavior locally
without requiring live providers, DNS, TLS certificates, production credentials,
or real customer data.

#### Scenario: Local verifier covers access and transport gates
- **WHEN** the production access transport check runs
- **THEN** it SHALL verify gate order, required prerequisites, conservative
  statuses, current blockers, top-level V1 linkage, no-secret output, and the
  next implementation wave

#### Scenario: Browser verification occurs before archive
- **WHEN** this change is ready to archive
- **THEN** verification SHALL include OpenSpec validation, local gate checks,
  lint/type/build checks, and Playwright desktop/mobile checks of the rendered
  cockpit surface before archiving

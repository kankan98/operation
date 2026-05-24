## ADDED Requirements

### Requirement: Public preview can reach its preview database
The Docker deployment baseline SHALL provide a documented internal V0 public
preview launch path that gives the web preview container a container-reachable
PostgreSQL `DATABASE_URL` without exposing the local preview database publicly.

#### Scenario: Preview database service is started
- **WHEN** a contributor prepares the internal V0 public preview on the server
- **THEN** the documented steps SHALL start the Compose Postgres service on the
  repository's user-defined Docker network before launching the web preview

#### Scenario: Preview web container joins database network
- **WHEN** the long-lived web preview container is started for internal V0
  evaluation
- **THEN** the command SHALL attach it to the same user-defined Docker network
  as the preview Postgres service and pass a `DATABASE_URL` whose host is
  reachable from inside the web container

#### Scenario: Preview database stays local to host and Docker network
- **WHEN** the internal V0 public preview uses the Compose Postgres service
- **THEN** the database SHALL remain bound to the host loopback interface for
  host-side commands and reachable to the web preview through Docker networking,
  without publishing Postgres on a public interface

#### Scenario: Preview database URL can be overridden
- **WHEN** the default local Compose database is not the desired preview
  database
- **THEN** the launch path SHALL allow an operator-provided preview database URL
  without committing production credentials

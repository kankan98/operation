## ADDED Requirements

### Requirement: Public preview can use Docker restart policy
The Docker deployment baseline SHALL document a long-lived public preview mode
that uses a named container and Docker restart policy so the preview can restart
after host or Docker daemon restarts when the Docker service is enabled.

#### Scenario: Public preview container is started
- **WHEN** a contributor starts the public preview as a long-lived container
- **THEN** the documented command uses a stable container name and a restart
  policy such as `--restart unless-stopped` instead of `--rm`

#### Scenario: Disposable local run is used
- **WHEN** a contributor starts a local one-off Docker run for quick
  verification
- **THEN** the disposable `docker:run` behavior may still remove the container
  on exit and is not treated as the public preview restart strategy

#### Scenario: Host restarts
- **WHEN** the server host or Docker daemon restarts after the public preview
  container was intentionally left running with restart policy
- **THEN** Docker is expected to restart the named preview container, subject to
  the Docker service itself being enabled on the host

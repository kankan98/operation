## ADDED Requirements

### Requirement: Deployment Process
The system SHALL define a repeatable deployment process for production environments with verification steps.

#### Scenario: Pre-deployment checks are performed
- **WHEN** preparing for deployment
- **THEN** all tests MUST pass, code coverage MUST meet standards, security scan MUST be clean, and production .env configuration MUST be verified

#### Scenario: Backend deployment steps are documented
- **WHEN** deploying backend to production
- **THEN** the process MUST include: pull latest code from main branch, install production dependencies (npm ci), run database migrations, build application (npm run build), start production server, and verify health check endpoint

#### Scenario: Frontend deployment steps are documented
- **WHEN** deploying frontend to production
- **THEN** the process MUST include: update VITE_API_BASE_URL to production API, build production bundle (npm run build), verify build output, deploy static files to hosting, and test production URL

#### Scenario: Rollback process is defined
- **WHEN** deployment fails or causes issues
- **THEN** rollback procedure MUST be documented: revert to previous version, restore database if needed, verify rollback success, and document what went wrong

### Requirement: Environment Configuration Management
The system SHALL document how to manage configuration across development, staging, and production environments.

#### Scenario: Environment-specific configs are separated
- **WHEN** configuring different environments
- **THEN** each environment MUST have separate .env file (.env.development, .env.production), sensitive values MUST NOT be committed to git, and production secrets MUST use secure secret management (not .env files in production)

#### Scenario: Configuration validation is enforced
- **WHEN** application starts
- **THEN** required environment variables MUST be validated on startup, missing or invalid config MUST prevent startup with clear error message, and config schema MUST be documented in code (config/index.ts)

#### Scenario: Configuration changes are tracked
- **WHEN** environment variables change
- **THEN** changes MUST be documented in deployment notes, team MUST be notified of breaking config changes, and .env.example MUST be kept up to date

### Requirement: Monitoring and Logging
The system SHALL define logging standards and monitoring practices for production systems.

#### Scenario: Log levels are used appropriately
- **WHEN** writing logs
- **THEN** ERROR MUST be used for failures requiring immediate attention, WARN for recoverable issues that need monitoring, INFO for important business events, and DEBUG for detailed troubleshooting information (disabled in production)

#### Scenario: Structured logging is used
- **WHEN** logging events
- **THEN** logs MUST include: timestamp, log level, message, request ID (for API calls), user ID (if authenticated), and relevant context data as structured fields

#### Scenario: Log retention is defined
- **WHEN** managing log files
- **THEN** logs MUST be rotated daily, logs MUST be retained for at least 30 days, and archived logs SHOULD be compressed

#### Scenario: Monitoring alerts are configured
- **WHEN** setting up production monitoring
- **THEN** alerts MUST be configured for: error rate exceeding threshold, API response time degradation, database connection failures, and disk space low warnings

### Requirement: Health Checks and Uptime
The system SHALL provide health check endpoints and uptime monitoring.

#### Scenario: Health check endpoint exists
- **WHEN** checking application health
- **THEN** GET /health endpoint MUST return 200 OK when healthy, response MUST include service status and version, and endpoint MUST verify database connectivity

#### Scenario: Dependency health is checked
- **WHEN** monitoring system health
- **THEN** health check MUST verify: database is accessible, external API credentials are valid, and critical services are responsive

#### Scenario: Uptime is monitored
- **WHEN** running in production
- **THEN** uptime monitoring service SHOULD ping health endpoint every 1-5 minutes, downtime alerts SHOULD be sent immediately, and uptime history SHOULD be tracked

### Requirement: Backup and Recovery
The system SHALL define backup procedures and disaster recovery plans.

#### Scenario: Database backups are automated
- **WHEN** running in production
- **THEN** SQLite database MUST be backed up daily, backups MUST be stored in separate location from application, backup retention MUST be at least 30 days, and backups MUST be tested for restoration periodically

#### Scenario: Recovery procedure is documented
- **WHEN** recovering from data loss
- **THEN** the guide MUST explain: how to stop application, how to restore database from backup, how to verify data integrity after restore, and how to restart application

#### Scenario: Configuration is backed up
- **WHEN** backing up system
- **THEN** environment configuration MUST be documented (not backed up in plain text), deployment scripts MUST be version controlled, and infrastructure configuration MUST be in code (Infrastructure as Code)

### Requirement: Security in Production
The system SHALL enforce security best practices for production deployments.

#### Scenario: HTTPS is enforced
- **WHEN** running in production
- **THEN** all traffic MUST use HTTPS, HTTP requests MUST redirect to HTTPS, and TLS certificates MUST be valid and renewed before expiration

#### Scenario: Secrets are managed securely
- **WHEN** handling production secrets
- **THEN** secrets MUST NOT be in .env files committed to git, secrets MUST use environment variables or secret management service, and secrets MUST be rotated periodically

#### Scenario: Access is controlled
- **WHEN** accessing production systems
- **THEN** SSH access MUST require key authentication (not passwords), database access MUST be IP-restricted, and admin actions MUST be logged

### Requirement: Performance Monitoring
The system SHALL track and report on key performance metrics in production.

#### Scenario: API performance is tracked
- **WHEN** monitoring API performance
- **THEN** metrics MUST include: average response time per endpoint, 95th percentile response time, error rate percentage, and requests per minute

#### Scenario: Database performance is monitored
- **WHEN** monitoring database
- **THEN** metrics MUST include: slow query log (queries > 1s), connection pool usage, database file size growth, and index usage statistics

#### Scenario: Frontend performance is measured
- **WHEN** monitoring frontend
- **THEN** metrics SHOULD include: Core Web Vitals (LCP, FID, CLS), bundle size over time, and client-side error rate

### Requirement: Incident Response
The system SHALL define procedures for responding to production incidents.

#### Scenario: Incident severity is classified
- **WHEN** an incident occurs
- **THEN** incidents MUST be classified as: P0 (complete outage), P1 (major feature broken), P2 (minor feature broken), or P3 (cosmetic issue)

#### Scenario: Incident response is immediate
- **WHEN** P0 or P1 incident is detected
- **THEN** on-call engineer MUST acknowledge within 15 minutes, investigation MUST begin immediately, status updates MUST be posted every 30 minutes, and post-mortem MUST be written within 48 hours after resolution

#### Scenario: Post-mortem is conducted
- **WHEN** incident is resolved
- **THEN** post-mortem MUST include: timeline of events, root cause analysis, what went well, what went poorly, action items to prevent recurrence, and lessons learned

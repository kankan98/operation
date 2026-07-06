## Context

The general frontend API client already uses same-origin `/api`, but `chatApi.ts` and `taskApi.ts` independently read `VITE_API_BASE_URL` with a `http://localhost:3001/api` fallback. Production deployment currently preserves `frontend/.env`; if that file contains a localhost API value, Vite bakes it into the production bundle. From `http://203.195.161.93`, browser requests to `http://localhost:3001` target the user's machine, not the server, and are blocked before reaching the app backend.

## Goals / Non-Goals

**Goals:**

- Prevent production chat and task clients from using localhost, 127.0.0.1, or `[::1]` API origins when `window.location.hostname` is non-local.
- Keep local development behavior unchanged for `localhost`, `127.0.0.1`, and `[::1]` browser origins.
- Keep explicitly configured public API origins working for split frontend/backend deployments.
- Ensure REST requests and direct SSE URLs use the same resolved base URL.

**Non-Goals:**

- Do not change backend chat, task, or SSE route contracts.
- Do not redesign chat loading/error UI in this change.
- Do not remove `VITE_API_BASE_URL`; it remains valid for non-local public API origins.

## Decisions

- Add a small shared frontend helper that resolves the configured API base URL against the current browser origin.
  - Rationale: chat REST, task REST, and SSE all need identical logic. A helper avoids three subtly different fixes.
  - Alternative considered: edit production `.env` or deployment copy behavior only. That would fix this server but leave future production bundles vulnerable to the same misconfiguration.

- Treat loopback API origins as development-only unless the browser page itself is served from a loopback hostname.
  - Rationale: from a public origin, loopback points at the end user's machine and is not a reachable server-side backend.

- Fall back to relative `/api` rather than an absolute `http://203.195.161.93/api`.
  - Rationale: same-origin URLs work behind IP, DNS, HTTP/HTTPS, and reverse proxies without rebuilding for each host.

## Risks / Trade-offs

- Deployments intentionally serving a public frontend that must call a developer's local backend will now fall back to `/api`; this is not a supported production topology.
- Custom public API origins must be non-loopback URLs; tests should cover that they remain preserved.

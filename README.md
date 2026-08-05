# ACS OBA Shepherds Programme

A responsive alumni mentorship platform built with Next.js, Auth0, and Convex.
It supports mentor discovery, privacy-aware matching, mentorship requests,
shared workspaces, meetings, goals, pulse surveys, exit feedback, incident
reporting, notifications, and an administrator operations dashboard.

## Application

The deployable project is in [`web/`](web/).

```bash
cd web
cp .env.example .env.local
# Replace every placeholder in .env.local with real development values.
npm ci
# Terminal 1 (keeps running)
npx convex dev
# Terminal 2
npm run dev
```

`npx convex dev` is a watch process, so run it and `npm run dev` in separate
terminals.

See [`DEBUGGING_AND_INTEGRATION.md`](DEBUGGING_AND_INTEGRATION.md) before
configuring Auth0, Convex, the ACSOBA verification service, or the head
administrator.

## Administrator access

Administrator identities authenticate through Auth0. ACSOBA membership
verification is a separate participant-onboarding control and does not grant
administrator access. The server-only Convex variable `HEAD_ADMIN_EMAIL`
identifies the verified Auth0 email allowed to claim the one-time head-admin
membership on first sign-in. The head admin can then invite or revoke ordinary
administrators by verified email.

The application does not create an Auth0 identity or a password. The identity
must already exist in the configured identity provider.

## Key documentation

- [`DEBUGGING_AND_INTEGRATION.md`](DEBUGGING_AND_INTEGRATION.md) - setup,
  environment variables, deployment, troubleshooting, and extension guide
- [`CODE_CHANGE_REPORT.md`](CODE_CHANGE_REPORT.md) - implementation details,
  requirement traceability, assumptions, and validation
- [`ERD.md`](ERD.md) - current data model and authorization boundaries
- [`DESIGN.md`](DESIGN.md) - visual design system
- [`web/docs/onboarding-routing.md`](web/docs/onboarding-routing.md) -
  onboarding flow
- [`web/docs/privacy-settings.md`](web/docs/privacy-settings.md) - mentor
  identity disclosure

## Quality commands

```bash
cd web
npm run check
npm run build
```

`npm run build:webpack` is available as a diagnostic fallback in constrained
containers where Turbopack cannot read host process metrics.

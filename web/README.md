# Shepherds web application

Next.js 16 + React 19 frontend and Convex backend for the ACS OBA Shepherds
Programme.

## Local development

```bash
cp .env.example .env.local
# Replace every placeholder in .env.local with real development values.
npm ci
# Terminal 1 (keeps running)
npx convex dev
# Terminal 2
npm run dev
```

`npx convex dev` watches for backend changes, so keep it running in a separate
terminal from the Next.js development server.

The full setup, Auth0 configuration, Convex environment variables, head-admin
bootstrap, deployment, and troubleshooting instructions are in
[`../DEBUGGING_AND_INTEGRATION.md`](../DEBUGGING_AND_INTEGRATION.md).

## Checks

```bash
npm run check
npm run build
```

Use `npm run build:webpack` only as a diagnostic fallback in constrained
containers where Turbopack cannot access process metrics.

## Code organization

- `src/app` - application routes
- `src/components` - feature and shared UI
- `convex/*.ts` - thin public Convex query/mutation/action wrappers
- `convex/model/*.ts` - domain logic and authorization
- `convex/model/*/fields.ts` - reusable validators and schema fields
- `convex/schema.ts` - authoritative database schema

Run `npx convex codegen` after adding or renaming public Convex modules in a
configured deployment.

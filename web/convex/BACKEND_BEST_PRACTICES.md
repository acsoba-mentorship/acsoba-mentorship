# Convex Backend Best Practices

This document captures practical guidelines for building and maintaining Convex backends with strong runtime safety, clean architecture, and low duplication.

## 1) Keep Public API Wrappers Thin

- Define public endpoints in top-level files such as `users.ts` and `mentorRequests.ts`.
- Keep each `query` / `mutation` / `action` handler short and delegate business logic to model functions.
- Use wrappers mainly for:
  - `args` validation
  - endpoint-level documentation
  - routing to model logic

Why: this keeps API files readable and makes core logic easier to test and reuse.

## 2) Use One Source of Truth for Field Validators

- Define domain field validators once (for example in `model/users/fields.ts`).
- Reuse the same field validators in `schema.ts` and endpoint arg validators.
- Prefer table field references when validating related args, e.g.:
  - `args: { username: usersTableFields.username }`

Why: schema and API validation stay in sync automatically when field types evolve.

## 3) Inline Simple Arg Validators, Extract Complex Ones

- For small arg objects (roughly <= 4 fields), inline `args` directly in endpoint definitions.
- For larger/reused arg shapes, define dedicated validator objects in `validators.ts`.

Good split:
- Inline: `{ requestId: v.id("mentorshipRequests") }`, `{ limit: v.optional(v.number()) }`
- Extracted: full profile update payloads, deeply nested objects, or reused multi-field shapes

Why: avoids unnecessary indirection while keeping complex validations maintainable.

## 4) Derive Types from Validators (Not Manual String/Number Types)

- In model function signatures, prefer validator-derived types with `Infer`.
- For schema-backed fields, use direct field-based inference:
  - `Infer<typeof usersTableFields.username>`
- For object validators, use:
  - `Infer<typeof updateUserProfileArgsValidator>`

Why: runtime validation and TypeScript types stay aligned; fewer stale manual types.

## 5) Use Composition to Reduce Validator Duplication

- Use validator composition methods where applicable:
  - `.pick(...)`
  - `.omit(...)`
  - `.partial()`
  - `.extend(...)`
- Build larger domain validators first, then derive endpoint-specific variants.

Why: reduces copy/paste and makes intent explicit.

## 6) Separate Pure Helpers from Convex Context Logic

- Keep pure synchronous utilities in `helper.ts` (no `ctx`, no DB calls).
- Keep DB/auth/transaction logic in model modules (`model/*.ts`).
- Shared auth guards should live in one place (for example `model/auth.ts`).

Why: pure helpers remain reusable and test-friendly; model layer contains all data access concerns.

## 7) Prefer Explicit Table Names in DB Operations

- Use explicit table names in data operations:
  - `ctx.db.get("users", id)`
  - `ctx.db.patch("users", id, patch)`

Why: clearer intent and future-safe with Convex table-id best practices.

## 8) Avoid `.filter` on DB Query Builders

- Prefer `withIndex(...)` for filtering whenever possible.
- If needed, collect a bounded indexed set and then filter in TypeScript.

Why: better query performance and more predictable scaling behavior.

## 9) Avoid `Date.now()` as Implicit Query Input

- Do not rely on `Date.now()` inside query logic for user-visible state.
- Pass coarse-grained time from the client (for example minute-bucketed `nowMs`) or redesign around persisted fields.

Why: improves cache behavior and avoids stale/reactivity surprises.

## 10) Keep Contracts Stable, Evolve Internals

- During refactors, preserve:
  - endpoint names
  - args shape (unless intentionally changed)
  - return shape relied on by frontend
- Change internal structure (model/helper/validators) without forcing client churn.

Why: safer iterative refactors and fewer regressions.

## 11) Documentation Standards

- Add concise JSDoc on exported endpoints and important model functions:
  - who can call it
  - what it returns
  - notable side effects/errors

Why: improves maintainability and makes future refactors faster.

## 12) Verification Checklist for Each Refactor

- Validate frontend callsites still match API args/returns.
- Run lint and type/build checks.
- Confirm no accidental auth/access-control regression.
- Confirm no performance regression from query/index changes.

Suggested commands:

- `npm run lint`
- `npm run build`

---

Use these guidelines as defaults. Do NOT break them intentionally, instead provide suggestion and always ask even when a concrete use case justifies the trade-off.

Model/handler separation: Placing logic in convex/model/users.ts and keeping the public endpoint thin in convex/users.ts aligns with the recommended pattern of putting most logic in a model directory. [best practices]

Reusing schema validators: Using usersTableFields.username directly as the args validator (instead of duplicating v.string() or similar) keeps your argument validation in sync with your schema automatically. [validators in sync]

Using Infer for helper typing: Typing the helper function's argument as Infer<typeof usersTableFields.username> avoids duplicating type definitions and derives the TypeScript type directly from the validator. [extracting types]

Using withIndex instead of .filter: Querying with .withIndex("by_username", ...) is the recommended efficient approach. [best practices]

Returning only selected fields: Rather than returning the full document, you return a projection. This is good for preventing accidental data leakage.
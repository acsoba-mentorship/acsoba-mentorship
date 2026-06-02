# Mentor Privacy Settings

This document captures the current mentor privacy implementation, data flow, and edge cases.

## Overview

Mentor privacy settings let mentors control disclosure of private identity fields while keeping public mentor information discoverable. Public mentor information includes fields such as title, bio, location, years of experience, industries, and expertise. Private identity fields currently include name, username, email, and phone number.

The feature is role-scoped to the mentor side of a user account. A user can be both a mentee and mentor; these settings only redact that user's mentor identity when other users view mentor-related surfaces.

## Data Model

Mentor privacy settings are stored on the `users` document under `mentorSettings.privacy`.

```ts
mentorSettings: {
  privacy: {
    masterIdentityDisclosure: boolean;
    overrides?: {
      name?: boolean;
      email?: boolean;
      phoneNumber?: boolean;
    };
  };
}
```

The field is optional for backward compatibility. If `mentorSettings.privacy` is missing, the app uses these defaults:

- `masterIdentityDisclosure`: `true`
- `name`: `true`
- `email`: `false`
- `phoneNumber`: `false`

Important: the app reads `user.mentorSettings.privacy`. A top-level `privacy` object on the user document is ignored.

## Visibility Rules

Visibility is resolved by `resolveMentorIdentityVisibility` in `web/convex/helper.ts`.

If `masterIdentityDisclosure` is `false`, all private identity fields are hidden unless a relationship override applies. This means:

- `name` becomes `Anonymous Mentor`
- `username` becomes `null`
- `email` becomes `null`
- `phoneNumber` becomes `null`

If `masterIdentityDisclosure` is `true`, each override controls its field. Username follows name visibility, so hiding the mentor's name also hides their username.

## Accepted Request Override

Mentor identity is force-revealed when the viewer is relationship-authorized.

Current relationship authorization means:

- The viewer is the mentor themself, or
- The viewer is a mentee with an accepted mentorship request for that mentor.

This is why a mentee with an accepted request can still see/search a mentor's real name even if that mentor later turns identity disclosure off.

Accepted-request reveal is used in:

- Mentor listing via `listMentors`
- Public profile projections via `getUserByUsername` and `getUserById`
- Mentee-facing request views via `requestsByMentee`

Mentor-facing request views are not affected by mentor privacy settings because mentee profiles remain visible to mentors for mentorship workflows.

## Backend Endpoints

### Settings

`api.users.getMyMentorPrivacySettings`

Returns the current user's mentor privacy settings with defaults applied.

`api.users.updateMyMentorPrivacySettings`

Updates the current user's mentor privacy settings. The mutation accepts partial updates and preserves omitted values.

### Mentor Discovery

`api.users.listMentors`

Returns privacy-safe mentor DTOs. Each DTO includes a stable `mentorId` for navigation/request targeting, but may return `username: null` and `name: "Anonymous Mentor"` when identity is hidden.

### Profile Fetching

There are two public profile queries:

- `api.users.getUserByUsername`
- `api.users.getUserById`

Both return the same privacy-safe profile projection. Username lookup is used for normal public profile URLs. ID lookup is used when a mentor is anonymous and their username is hidden.

Frontend routes:

- `/profile/[username]` fetches by username.
- `/profile/id/[userId]` fetches by user ID.

Anonymous mentor cards and list items link to `/profile/id/[mentorId]`. Non-anonymous mentor cards continue to link to `/profile/[username]`.

### Mentorship Requests

`api.mentorRequests.createRequestByMentorId`

Creates a request using a mentor user ID. This supports anonymous mentors because the UI no longer needs a visible username to send a request.

`api.mentorRequests.createRequest`

The older username-based request mutation is still present for compatibility.

## Frontend Flow

The search page calls `api.users.listMentors` and performs local filtering over the privacy-safe mentor DTOs.

When a mentor is anonymous, the client only receives `Anonymous Mentor` for `name`, so searching by the real name will not match unless the viewer has accepted-request reveal.

Search still includes public fields:

- displayed name
- title
- bio
- expertise
- industries

So a query can still match an anonymous mentor through public profile content.

## Settings UI

The mentor settings page is at `/mentor/settings`.

It lets mentors control:

- Master identity disclosure
- Name disclosure
- Email disclosure
- Phone number disclosure

When the master toggle is off, per-field toggles are disabled in the UI because all identity fields are hidden.

## Seed Data

`web/convex/init.ts` seeds sample mentors with several privacy states for local verification:

- `sample_mentor_01` to `sample_mentor_03`: master identity disclosure off.
- `sample_mentor_04`: master disclosure on, but name/email/phone overrides off.
- `sample_mentor_05`: name/email on, phone off.

The seed is idempotent and patches these settings onto existing sample mentors.

Run:

```bash
npm run seed:sample-users
```

## Current Edge Cases

- If a viewer has an accepted request with a mentor, the mentor's identity is revealed even when disclosure is turned off.
- A mentor always sees their own identity because self-view is treated as relationship-authorized.
- Mentee profile visibility is unchanged; mentors can still see mentee names and request details in mentor-facing request views.
- Anonymous mentors can still be opened by profile ID and can still receive mentorship requests by mentor ID.
- Username is hidden when name is hidden, but the backend still stores it and can use it for compatibility endpoints.
- Convex query results are reactive; privacy changes should update subscribed clients without waiting for cache expiry.

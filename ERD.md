# ACS OBA Mentorship - Current Data Model ERD

This document reflects the **current** data model implemented in the codebase.
It supersedes the ERD in `README.md`, which still describes additional planned tables that are not yet in the active Convex schema.

## Backend ERD (Convex Schema - Source of Truth)

```mermaid
erDiagram
    users ||--o{ mentorshipRequests : "as mentor (mentorId)"
    users ||--o{ mentorshipRequests : "as mentee (menteeId)"

    users {
        id _id PK
        string name
        string username "unique via by_username index"
        number usernameUpdatedAt
        boolean isTemporaryUsername
        number dateOfBirth
        string gender
        string nationality
        string tokenIdentifier "indexed by by_token"
        string profilePictureUrl
        string title
        string bio
        string location
        string email
        string phoneNumber
        json[] education
        json[] experience
        json menteeProfile "optional: { goals, interests[] }"
        json mentorProfile "optional: { yearsOfExperience, industries[], expertise[], maxMentees, isAvailable }"
        string onboardingStatus "new|verified|user_profile_complete|mentee_profile_setup_complete"
        number createdAt
    }

    mentorshipRequests {
        id _id PK
        id mentorId FK "references users._id"
        id menteeId FK "references users._id"
        string status "pending|accepted|rejected"
        string message
        number createdAt
        number updatedAt
    }
```

## Backend Indexes

### `users`
- `by_token`: `tokenIdentifier`
- `by_username`: `username`
- `by_mentor_availability`: `mentorProfile.isAvailable`

### `mentorshipRequests`
- `by_mentorId`: `mentorId`
- `by_menteeId`: `menteeId`
- `by_mentorId_status`: `(mentorId, status)`
- `by_menteeId_status`: `(menteeId, status)`
- `by_mentorId_menteeId`: `(mentorId, menteeId)`

## Frontend Data Model (Consumed API Shapes)

The frontend is driven by Convex query/mutation contracts. The key UI entities are projections of backend documents:

```mermaid
erDiagram
    CurrentUser ||--|| UserDoc : "api.users.getCurrentUser"
    PublicProfile ||--|| UserDoc : "api.users.getUserByUsername projection"
    MentorCardItem ||--|| UserDoc : "api.users.listMentors projection"
    MentorRequestView ||--|| MentorshipRequestDoc : "api.mentorRequests.requestsByMentor"
    MenteeRequestView ||--|| MentorshipRequestDoc : "api.mentorRequests.requestsByMentee"

    UserDoc {
        string _id
        string username
        string name
        string title
        string bio
        string location
        string email
        string tokenIdentifier
        json menteeProfile
        json mentorProfile
        string onboardingStatus
    }

    MentorshipRequestDoc {
        string _id
        string mentorId
        string menteeId
        string status
        string message
        number createdAt
        number updatedAt
    }

    PublicProfile {
        string username
        string name
        string title
        string bio
        string location
        string profilePictureUrl
        json[] education
        json[] experience
        json menteeProfile
        json mentorProfile
    }

    MentorCardItem {
        string username
        string name
        string title
        string bio
        string location
        string profilePictureUrl
        json mentorProfile
    }

    MentorRequestView {
        string _id
        string mentorId
        string menteeId
        string status
        string message
        number createdAt
        string menteeName
        string menteeInitials
        string menteeTitle
        string[] interests
    }

    MenteeRequestView {
        string _id
        string mentorId
        string menteeId
        string status
        string message
        number createdAt
        string mentorName
        string mentorInitials
        string mentorTitle
        string mentorUsername
        string[] expertise
    }
```

## README ERD vs Current State

`README.md` currently describes a broader target design with tables like `Mentors`, `Mentees`, `Mentorships`, `PulseSurveys`, `ExitSurveys`, `IncidentReports`, and `UserInterests`.

The **implemented** schema today uses:
- one consolidated `users` table for identity + role-specific profile data
- one `mentorshipRequests` table for request lifecycle
- no `mentorships` table yet (still marked as TODO in `web/convex/schema.ts`)

Use this file as the up-to-date ERD reference until the planned tables are added to the Convex schema.

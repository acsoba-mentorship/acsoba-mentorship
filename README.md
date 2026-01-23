# acsoba-mentorship

## Database Schema (ERD)

The database uses a normalized structure where `Users` holds the core identity, while `Mentors` and `Mentees` tables hold role-specific data. This allows a single user to function as both a mentor and a mentee.

```mermaid
erDiagram
    %% Core Identity
    Users ||--o| Mentors : "registered_as"
    Users ||--o| Mentees : "registered_as"
    Users ||--o{ UserInterests : "has"
    Users ||--o{ IncidentReports : "reports"
    Users ||--o{ IncidentReports : "is_reported_in"

    %% Role-Specific Relationships
    Mentees ||--o{ MentorshipRequests : "sends"
    Mentors ||--o{ MentorshipRequests : "receives"
    
    Mentors ||--o{ Mentorships : "leads"
    Mentees ||--o{ Mentorships : "participates_in"

    %% Survey logic linked to the specific Mentorship instance
    Mentorships ||--o{ PulseSurveys : "generates"
    Mentorships ||--o{ ExitSurveys : "completes"

    Users {
        uuid id PK
        string acsoba_id "For FR1/FR2 verification"
        string email
        string full_name
        string profile_pic_url
        string bio
        string company
        string location
        string industry_primary
        boolean is_admin
        timestamp created_at
    }

    Mentors {
        uuid id PK
        uuid user_id FK
        int max_mentees "FR4: Mentor specific limit"
        boolean is_available "FR4: Toggle availability"
        int years_of_experience
        timestamp created_at
    }

    Mentees {
        uuid id PK
        uuid user_id FK
        text learning_goals
        timestamp created_at
    }

    UserInterests {
        uuid id PK
        uuid user_id FK
        string keyword "Industry/Expertise tags"
        string type "ENUM: INTEREST (Mentee) or EXPERTISE (Mentor)"
    }

    MentorshipRequests {
        uuid id PK
        uuid mentee_id FK "Refs Mentees.id"
        uuid mentor_id FK "Refs Mentors.id"
        text message
        string status "ENUM: PENDING, ACCEPTED, REJECTED, EXPIRED"
        timestamp created_at "Used for FR8 Auto Expire"
        timestamp updated_at
    }

    Mentorships {
        uuid id PK
        uuid request_id FK "Link to original request"
        uuid mentor_id FK "Refs Mentors.id"
        uuid mentee_id FK "Refs Mentees.id"
        date start_date
        date end_date
        string status "ENUM: ACTIVE, COMPLETED, TERMINATED"
    }

    PulseSurveys {
        uuid id PK
        uuid mentorship_id FK
        uuid respondent_user_id FK "Refs Users.id (Author)"
        int health_score "1-10 scale"
        text feedback
        timestamp created_at
    }

    ExitSurveys {
        uuid id PK
        uuid mentorship_id FK
        uuid respondent_user_id FK "Refs Users.id (Author)"
        text reason_for_leaving
        int final_rating
        timestamp created_at
    }

    IncidentReports {
        uuid id PK
        uuid reporter_user_id FK "Refs Users.id"
        uuid reported_user_id FK "Refs Users.id"
        string category "e.g., Misconduct"
        text description
        boolean is_resolved
        timestamp created_at
    }
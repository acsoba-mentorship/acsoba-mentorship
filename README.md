# acsoba-mentorship

erDiagram
    Users ||--o{ MentorshipRequests : "initiates"
    Users ||--o{ MentorshipRequests : "receives"
    Users ||--o{ Mentorships : "participates_as_mentor"
    Users ||--o{ Mentorships : "participates_as_mentee"
    Users ||--o{ IncidentReports : "reports"
    Users ||--o{ UserInterests : "has"
    
    Mentorships ||--o{ PulseSurveys : "generates"
    Mentorships ||--o{ ExitSurveys : "completes"

    Users {
        uuid id PK
        string acsoba_id "For FR1/FR2 verification"
        string email
        string full_name
        string role "ENUM: MENTOR, MENTEE, ADMIN"
        boolean is_admin
        string profile_pic_url
        string bio
        string company
        string location
        string industry_primary
        int max_mentees "FR4: Mentor specific"
        boolean is_available "FR4: Mentor toggle"
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
        uuid mentee_id FK
        uuid mentor_id FK
        text message
        string status "ENUM: PENDING, ACCEPTED, REJECTED, EXPIRED"
        timestamp created_at "Used for FR8 Auto Expire"
        timestamp updated_at
    }

    Mentorships {
        uuid id PK
        uuid request_id FK "Link to original request"
        uuid mentor_id FK
        uuid mentee_id FK
        date start_date
        date end_date
        string status "ENUM: ACTIVE, COMPLETED, TERMINATED"
    }

    PulseSurveys {
        uuid id PK
        uuid mentorship_id FK
        uuid respondent_id FK
        int health_score "1-10 scale"
        text feedback
        timestamp created_at
    }

    ExitSurveys {
        uuid id PK
        uuid mentorship_id FK
        uuid respondent_id FK
        text reason_for_leaving
        int final_rating
        timestamp created_at
    }

    IncidentReports {
        uuid id PK
        uuid reporter_id FK
        uuid reported_user_id FK
        string category "e.g., Misconduct"
        text description
        boolean is_resolved
        timestamp created_at
    }
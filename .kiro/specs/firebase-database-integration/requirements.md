# Requirements Document

## Introduction

This document specifies the requirements for a Firebase database integration that supports a trust-first, verified, smart-matching room and rental platform. The platform connects students, exam candidates, interns, and working professionals seeking accommodation with students and PG owners who have available space. The system emphasizes identity verification, intelligent matching algorithms, real-time communication, and comprehensive safety controls to eliminate broker involvement and ensure user trust.

## Glossary

- **Firebase_Database**: The Firebase Firestore NoSQL cloud database service used for data storage and real-time synchronization
- **User**: A registered platform member who can be either a Searcher or a Poster
- **Searcher**: A User looking for accommodation (student, exam candidate, intern, or working professional)
- **Poster**: A User offering accommodation (student or PG owner with available space)
- **Verification_System**: The subsystem responsible for validating user identity through document and biometric verification
- **Matching_Engine**: The subsystem that calculates compatibility scores between Users based on multiple criteria
- **Listing**: A posted accommodation offering with details about available space, pricing, and requirements
- **Room_Request**: A posted accommodation need with date, duration, budget, and preferences
- **Chat_Session**: A real-time messaging conversation between two Users
- **Rating**: A 1-5 star evaluation with optional text review submitted after user interaction
- **Report**: A safety concern submission flagging fake identity, broker activity, scam, or harassment
- **Admin**: A platform administrator with elevated privileges for moderation and system management
- **Verification_Badge**: A visual indicator on User profiles showing completed verification steps
- **Emergency_Request**: A Room_Request with urgent timeline (typically 1-3 days) that auto-expires after 3 days
- **Match_Score**: A numerical value representing compatibility between a Searcher and a Listing or Poster
- **Security_Rules**: Firebase security rules that enforce data access permissions and validation
- **Real_Time_Listener**: A Firebase mechanism for receiving live updates when data changes
- **Collection**: A Firebase Firestore container for documents of similar type
- **Document**: A Firebase Firestore record containing fields and subcollections

## Requirements

### Requirement 1: User Profile Data Management

**User Story:** As a platform user, I want my profile information securely stored and retrievable, so that I can maintain my identity and preferences on the platform

#### Acceptance Criteria

1. THE Firebase_Database SHALL store User documents in a "users" Collection with fields for user_id, name, age, gender, phone, email, city, home_district, user_type, created_at, and updated_at
2. WHEN a User completes student verification, THE Firebase_Database SHALL store college, course, year, and student_id_url fields in the User document
3. WHEN a User completes professional verification, THE Firebase_Database SHALL store company, role, and professional_id_url fields in the User document
4. WHEN a User completes identity verification, THE Firebase_Database SHALL store aadhaar_verified, pan_verified, selfie_url, and verification_status fields in the User document
5. THE Firebase_Database SHALL store verification_badges as an array field containing completed verification types
6. WHEN User profile data is updated, THE Firebase_Database SHALL update the updated_at timestamp field
7. THE Firebase_Database SHALL index User documents by user_id, email, and phone for efficient retrieval

### Requirement 2: Identity Verification Data Storage

**User Story:** As a platform administrator, I want verification documents and status tracked in the database, so that I can ensure all users are properly verified

#### Acceptance Criteria

1. THE Firebase_Database SHALL store verification documents in a "verifications" Collection with fields for user_id, verification_type, document_url, status, submitted_at, and reviewed_at
2. WHEN a verification document is submitted, THE Firebase_Database SHALL set status to "pending"
3. WHEN an Admin reviews a verification, THE Firebase_Database SHALL update status to "approved" or "rejected" and set reviewed_at timestamp
4. THE Firebase_Database SHALL store selfie_url and liveness_check_result for biometric verification
5. THE Firebase_Database SHALL maintain a verification_history subcollection under each User document tracking all verification attempts
6. THE Firebase_Database SHALL index verifications by user_id and status for Admin review queries

### Requirement 3: Listing Data Management

**User Story:** As a poster, I want my accommodation listings stored with all details, so that searchers can find and view my available space

#### Acceptance Criteria

1. THE Firebase_Database SHALL store Listing documents in a "listings" Collection with fields for listing_id, poster_id, title, description, listing_type, rent_amount, deposit_amount, available_from, location, city, latitude, longitude, amenities, preferences, images, status, created_at, and updated_at
2. THE Firebase_Database SHALL support listing_type values of "long_term", "pg", "flatmate", "short_stay", and "emergency"
3. THE Firebase_Database SHALL store preferences as a map containing gender_preference, profession_preference, and other_requirements
4. THE Firebase_Database SHALL store images as an array of image URLs with maximum 10 images per Listing
5. THE Firebase_Database SHALL index Listing documents by city, listing_type, status, and available_from for search queries
6. WHEN a Listing is created or updated, THE Firebase_Database SHALL update the updated_at timestamp
7. THE Firebase_Database SHALL support status values of "active", "inactive", "rented", and "deleted"

### Requirement 4: Room Request Data Management

**User Story:** As a searcher, I want my room requests stored and discoverable, so that posters can find and respond to my accommodation needs

#### Acceptance Criteria

1. THE Firebase_Database SHALL store Room_Request documents in a "room_requests" Collection with fields for request_id, searcher_id, title, description, needed_from, needed_until, budget_min, budget_max, city, preferences, request_type, status, created_at, expires_at, and updated_at
2. WHEN a Room_Request is created with request_type "emergency", THE Firebase_Database SHALL set expires_at to 3 days from created_at
3. THE Firebase_Database SHALL support status values of "active", "fulfilled", "expired", and "deleted"
4. THE Firebase_Database SHALL index Room_Request documents by city, request_type, status, and expires_at for search and expiration queries
5. WHEN expires_at timestamp is reached for an Emergency_Request, THE Firebase_Database SHALL support automated status update to "expired"
6. THE Firebase_Database SHALL store preferences as a map containing location_preference, amenities_required, and other_requirements

### Requirement 5: Smart Matching Data Storage

**User Story:** As a searcher, I want the system to calculate and store match scores, so that I can see the most compatible listings first

#### Acceptance Criteria

1. THE Firebase_Database SHALL store Match_Score documents in a "match_scores" Collection with fields for match_id, searcher_id, listing_id, overall_score, education_score, college_score, profession_score, hometown_score, gender_match, proximity_score, calculated_at
2. THE Firebase_Database SHALL store score values as integers between 0 and 100
3. THE Firebase_Database SHALL index match_scores by searcher_id and overall_score for personalized feed generation
4. WHEN matching criteria change for a User or Listing, THE Firebase_Database SHALL support recalculation and update of affected Match_Score documents
5. THE Firebase_Database SHALL store matching_criteria as a subcollection under User documents containing weights for each matching factor
6. THE Firebase_Database SHALL support compound queries on match_scores filtering by searcher_id and ordering by overall_score descending

### Requirement 6: Real-Time Chat Data Management

**User Story:** As a user, I want my chat conversations stored and synchronized in real-time, so that I can communicate seamlessly with other users

#### Acceptance Criteria

1. THE Firebase_Database SHALL store Chat_Session documents in a "chats" Collection with fields for chat_id, participant_ids (array of 2 user_ids), created_at, last_message_at, and status
2. THE Firebase_Database SHALL store message documents in a "messages" subcollection under each Chat_Session with fields for message_id, sender_id, text, timestamp, read_status, and message_type
3. WHEN a new message is added, THE Firebase_Database SHALL update the Chat_Session last_message_at timestamp
4. THE Firebase_Database SHALL support Real_Time_Listener subscriptions for messages subcollection to enable live chat updates
5. THE Firebase_Database SHALL index Chat_Session documents by participant_ids for retrieving user conversations
6. THE Firebase_Database SHALL support status values of "active", "blocked_by_user1", "blocked_by_user2", and "blocked_by_both"
7. WHEN a User blocks a chat, THE Firebase_Database SHALL update the Chat_Session status field accordingly

### Requirement 7: Rating and Review Data Management

**User Story:** As a user, I want to submit and view ratings for other users, so that I can make informed decisions based on community feedback

#### Acceptance Criteria

1. THE Firebase_Database SHALL store Rating documents in a "ratings" Collection with fields for rating_id, reviewer_id, reviewee_id, listing_id, stars, review_text, created_at, status, and admin_notes
2. THE Firebase_Database SHALL enforce stars field values between 1 and 5 inclusive
3. THE Firebase_Database SHALL store aggregated rating statistics in User documents with fields for average_rating, total_ratings, and rating_distribution
4. WHEN a new Rating is submitted, THE Firebase_Database SHALL support recalculation of reviewee User aggregate rating fields
5. THE Firebase_Database SHALL support status values of "active", "flagged", and "removed"
6. THE Firebase_Database SHALL index Rating documents by reviewee_id and status for profile display queries
7. WHEN an Admin removes a Rating, THE Firebase_Database SHALL update status to "removed" and recalculate aggregate ratings

### Requirement 8: Report and Safety Data Management

**User Story:** As a user, I want to report safety concerns, so that administrators can review and take appropriate action

#### Acceptance Criteria

1. THE Firebase_Database SHALL store Report documents in a "reports" Collection with fields for report_id, reporter_id, reported_user_id, report_type, description, evidence_urls, status, created_at, reviewed_at, reviewer_id, and action_taken
2. THE Firebase_Database SHALL support report_type values of "fake_identity", "broker", "scam", and "harassment"
3. THE Firebase_Database SHALL support status values of "pending", "under_review", "resolved", and "dismissed"
4. THE Firebase_Database SHALL index Report documents by status and created_at for Admin review queue
5. WHEN an Admin reviews a Report, THE Firebase_Database SHALL update status, reviewed_at, reviewer_id, and action_taken fields
6. THE Firebase_Database SHALL store moderation_history as a subcollection under User documents tracking all Reports and actions taken
7. THE Firebase_Database SHALL store ban_status, ban_reason, and ban_expires_at fields in User documents for access control

### Requirement 9: Security Rules Implementation

**User Story:** As a platform administrator, I want database access controlled by security rules, so that users can only access and modify their authorized data

#### Acceptance Criteria

1. THE Security_Rules SHALL allow Users to read only their own User document
2. THE Security_Rules SHALL allow Users to update only their own User document excluding verification_status and verification_badges fields
3. THE Security_Rules SHALL allow only Admin users to read and write verification documents
4. THE Security_Rules SHALL allow Users to read Listing documents with status "active"
5. THE Security_Rules SHALL allow Users to create, update, and delete only their own Listing documents
6. THE Security_Rules SHALL allow Users to read Room_Request documents with status "active"
7. THE Security_Rules SHALL allow Users to create, update, and delete only their own Room_Request documents
8. THE Security_Rules SHALL allow Users to read Chat_Session documents only if their user_id is in participant_ids array
9. THE Security_Rules SHALL allow Users to create message documents only in Chat_Session documents where they are a participant
10. THE Security_Rules SHALL allow Users to create Rating documents only once per listing_id and reviewee_id combination
11. THE Security_Rules SHALL allow Users to read Rating documents for any User or Listing
12. THE Security_Rules SHALL allow Users to create Report documents but not update or delete them
13. THE Security_Rules SHALL allow only Admin users to update Report documents
14. THE Security_Rules SHALL deny all access to Users with ban_status "active" and ban_expires_at in the future

### Requirement 10: Real-Time Data Synchronization

**User Story:** As a user, I want live updates when relevant data changes, so that I see current information without manual refresh

#### Acceptance Criteria

1. WHEN a message is added to a Chat_Session, THE Firebase_Database SHALL push real-time updates to all participants via Real_Time_Listener
2. WHEN a User's verification_status changes, THE Firebase_Database SHALL push real-time updates to that User's active sessions
3. WHEN a new Listing matching a User's preferences is created, THE Firebase_Database SHALL support real-time notification delivery
4. WHEN a Room_Request status changes to "expired", THE Firebase_Database SHALL push real-time updates to the requesting User
5. THE Firebase_Database SHALL support Real_Time_Listener subscriptions on Collections with automatic reconnection on network interruption
6. WHEN a Chat_Session status changes to blocked, THE Firebase_Database SHALL immediately push updates to both participants

### Requirement 11: Data Validation and Integrity

**User Story:** As a platform administrator, I want data validated before storage, so that the database maintains consistent and valid information

#### Acceptance Criteria

1. THE Security_Rules SHALL validate that email fields match email format pattern before write operations
2. THE Security_Rules SHALL validate that phone fields contain exactly 10 digits before write operations
3. THE Security_Rules SHALL validate that age fields contain values between 18 and 100 before write operations
4. THE Security_Rules SHALL validate that rent_amount and budget fields contain positive numbers before write operations
5. THE Security_Rules SHALL validate that required fields are present before document creation
6. THE Security_Rules SHALL validate that stars field in Rating documents contains values between 1 and 5
7. THE Security_Rules SHALL validate that participant_ids array in Chat_Session documents contains exactly 2 unique user_ids
8. THE Security_Rules SHALL validate that listing_type and request_type fields contain only allowed enum values
9. THE Security_Rules SHALL validate that latitude values are between -90 and 90 and longitude values are between -180 and 180

### Requirement 12: Query Performance Optimization

**User Story:** As a user, I want fast search and retrieval of listings and requests, so that I can quickly find relevant accommodation options

#### Acceptance Criteria

1. THE Firebase_Database SHALL create composite indexes for queries filtering Listing documents by city and listing_type and ordering by created_at
2. THE Firebase_Database SHALL create composite indexes for queries filtering Room_Request documents by city and status and ordering by created_at
3. THE Firebase_Database SHALL create composite indexes for queries filtering match_scores by searcher_id and ordering by overall_score
4. THE Firebase_Database SHALL create composite indexes for queries filtering Chat_Session documents by participant_ids and ordering by last_message_at
5. THE Firebase_Database SHALL create composite indexes for queries filtering Report documents by status and ordering by created_at
6. THE Firebase_Database SHALL support pagination for Collection queries returning more than 20 documents
7. WHEN a query requires an index not yet created, THE Firebase_Database SHALL provide index creation suggestions in error messages

### Requirement 13: Data Backup and Recovery

**User Story:** As a platform administrator, I want automated database backups, so that data can be recovered in case of accidental deletion or corruption

#### Acceptance Criteria

1. THE Firebase_Database SHALL support automated daily backups of all Collections
2. THE Firebase_Database SHALL retain backup snapshots for at least 30 days
3. THE Firebase_Database SHALL support point-in-time recovery for data restoration
4. THE Firebase_Database SHALL provide export functionality for Collections in JSON format
5. THE Firebase_Database SHALL log all backup operations with timestamp and status
6. WHEN a backup operation fails, THE Firebase_Database SHALL retry up to 3 times before alerting administrators

### Requirement 14: Analytics and Monitoring Data

**User Story:** As a platform administrator, I want usage metrics and performance data tracked, so that I can monitor system health and user behavior

#### Acceptance Criteria

1. THE Firebase_Database SHALL store analytics events in an "analytics" Collection with fields for event_type, user_id, timestamp, metadata, and session_id
2. THE Firebase_Database SHALL support event_type values including "listing_view", "search_performed", "chat_initiated", "rating_submitted", and "report_filed"
3. THE Firebase_Database SHALL store daily aggregate statistics in a "daily_stats" Collection with fields for date, total_users, active_users, new_listings, new_requests, total_chats, and total_reports
4. THE Firebase_Database SHALL index analytics events by user_id and timestamp for user behavior analysis
5. THE Firebase_Database SHALL support time-series queries on daily_stats for trend analysis
6. THE Firebase_Database SHALL store performance_metrics documents tracking query latency, read operations, and write operations per hour

### Requirement 15: Notification Data Management

**User Story:** As a user, I want notifications stored and retrievable, so that I can stay informed about important platform activities

#### Acceptance Criteria

1. THE Firebase_Database SHALL store notification documents in a "notifications" Collection with fields for notification_id, user_id, type, title, message, related_id, read_status, created_at, and expires_at
2. THE Firebase_Database SHALL support type values including "new_match", "chat_message", "verification_approved", "listing_expired", and "request_response"
3. THE Firebase_Database SHALL index notification documents by user_id and read_status for user notification retrieval
4. WHEN a notification is created, THE Firebase_Database SHALL set read_status to false
5. WHEN a User views a notification, THE Firebase_Database SHALL update read_status to true
6. THE Firebase_Database SHALL support automated deletion of notification documents where expires_at timestamp has passed
7. THE Firebase_Database SHALL support Real_Time_Listener subscriptions on user notifications for live notification delivery


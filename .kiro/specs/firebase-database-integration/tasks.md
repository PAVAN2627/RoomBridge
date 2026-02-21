# Implementation Plan: Firebase Database Integration

## Overview

This implementation plan breaks down the Firebase Firestore database integration into discrete coding tasks. The system includes 11 Firestore collections, 5 Cloud Functions, comprehensive Security Rules, and a dual testing strategy using both unit tests and property-based tests with fast-check.

The implementation follows an incremental approach: set up infrastructure first, implement core collections and Security Rules, add Cloud Functions for background processing, and finally integrate real-time features and testing.

## Tasks

- [x] 1. Set up Firebase project infrastructure and configuration
  - Initialize Firebase project with Firestore, Authentication, Cloud Functions, and Storage
  - Configure Firebase emulators for local development (Firestore, Auth, Functions, Storage)
  - Set up TypeScript project structure with necessary dependencies (firebase-admin, firebase-functions, fast-check, jest)
  - Create firestore.indexes.json for composite indexes
  - Create storage.rules for Cloud Storage access control
  - _Requirements: All requirements depend on proper infrastructure_

- [ ] 2. Implement core data models and TypeScript interfaces
  - [x] 2.1 Create TypeScript interfaces for all 11 collections
    - Define UserDocument, VerificationDocument, ListingDocument, RoomRequestDocument, MatchScoreDocument, ChatSessionDocument, MessageDocument, RatingDocument, ReportDocument, NotificationDocument, AnalyticsEventDocument, DailyStatsDocument interfaces
    - Include all required and optional fields with proper types
    - Add JSDoc comments documenting field constraints
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 6.2, 7.1, 8.1, 14.1, 15.1_

  - [ ]* 2.2 Write property test for document structure completeness
    - **Property 1: Document Structure Completeness**
    - **Validates: Requirements 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 6.2, 7.1, 8.1, 14.1, 14.3, 14.6, 15.1**

  - [x] 2.3 Create validation helper functions
    - Implement validateEmail, validatePhone, validateAge, validateCoordinates, validateAmount functions
    - Add enum validation functions for listing_type, request_type, status fields
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.8, 11.9_

  - [ ]* 2.4 Write property tests for validation functions
    - **Property 45: Email Format Validation**
    - **Property 46: Phone Format Validation**
    - **Property 47: Age Range Validation**
    - **Property 48: Positive Amount Validation**
    - **Property 51: Coordinate Range Validation**
    - **Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.9**


- [ ] 3. Implement Firestore Security Rules
  - [x] 3.1 Create helper functions for Security Rules
    - Implement isAuthenticated, isOwner, isAdmin, isNotBanned, isValidEmail, isValidPhone helper functions
    - Add validation helpers for enum values, required fields, and data ranges
    - _Requirements: 9.1-9.14, 11.1-11.9_

  - [x] 3.2 Implement User collection Security Rules
    - Allow users to read only their own documents
    - Allow users to update own documents excluding verification_status and verification_badges
    - Validate all required fields and data formats on create/update
    - _Requirements: 9.1, 9.2, 11.1, 11.2, 11.3_

  - [ ]* 3.3 Write property tests for User Security Rules
    - **Property 30: User Self-Read Access**
    - **Property 31: User Self-Update with Field Restrictions**
    - **Validates: Requirements 9.1, 9.2**

  - [x] 3.4 Implement Verification collection Security Rules
    - Allow only admin users to read and write verification documents
    - Validate verification_type enum values and required fields
    - _Requirements: 9.3, 11.5_

  - [ ]* 3.5 Write property test for admin-only verification access
    - **Property 32: Admin-Only Verification Access**
    - **Validates: Requirements 9.3**

  - [x] 3.6 Implement Listing collection Security Rules
    - Allow users to read listings with status "active"
    - Allow users to create, update, delete only their own listings
    - Validate listing_type enum, required fields, images array size (max 10), and coordinate ranges
    - _Requirements: 9.4, 9.5, 3.2, 3.4, 11.4, 11.5, 11.8, 11.9_

  - [ ]* 3.7 Write property tests for Listing Security Rules
    - **Property 33: Active Listing Read Access**
    - **Property 34: Ownership-Based CRUD Access**
    - **Property 11: Enum Value Validation (listing_type)**
    - **Property 13: Array Size Constraint (images)**
    - **Validates: Requirements 9.4, 9.5, 3.2, 3.4**

  - [x] 3.8 Implement RoomRequest collection Security Rules
    - Allow users to read requests with status "active"
    - Allow users to create, update, delete only their own requests
    - Validate request_type enum, status enum, and required fields
    - _Requirements: 9.6, 9.7, 4.3, 11.5, 11.8_

  - [ ]* 3.9 Write property tests for RoomRequest Security Rules
    - **Property 35: Active Request Read Access**
    - **Property 34: Ownership-Based CRUD Access**
    - **Validates: Requirements 9.6, 9.7**

  - [x] 3.10 Implement Chat and Message Security Rules
    - Allow users to read chat sessions only if their user_id is in participant_ids
    - Allow users to create messages only in chats where they are participants
    - Validate participant_ids array contains exactly 2 unique user_ids
    - _Requirements: 9.8, 9.9, 11.7_

  - [ ]* 3.11 Write property tests for Chat Security Rules
    - **Property 36: Chat Participant Access**
    - **Property 37: Message Creation by Participants Only**
    - **Property 50: Participant Array Validation**
    - **Validates: Requirements 9.8, 9.9, 11.7**

  - [x] 3.12 Implement Rating collection Security Rules
    - Allow users to create ratings with uniqueness constraint (one per reviewer/reviewee/listing combination)
    - Allow all authenticated users to read ratings
    - Validate stars field range (1-5) and required fields
    - _Requirements: 9.10, 9.11, 7.2, 11.5, 11.6_

  - [ ]* 3.13 Write property tests for Rating Security Rules
    - **Property 38: Rating Uniqueness Constraint**
    - **Property 39: Public Rating Read Access**
    - **Property 23: Rating Stars Range Validation**
    - **Validates: Requirements 9.10, 9.11, 7.2, 11.6**

  - [x] 3.14 Implement Report collection Security Rules
    - Allow users to create reports (write-once, no updates or deletes)
    - Allow only admins to update reports
    - Validate report_type enum and required fields
    - _Requirements: 9.12, 9.13, 8.2, 11.5_

  - [ ]* 3.15 Write property tests for Report Security Rules
    - **Property 40: Write-Once Report Access**
    - **Property 41: Admin-Only Report Updates**
    - **Validates: Requirements 9.12, 9.13**

  - [x] 3.16 Implement ban status access control
    - Add global rule denying all access to users with active ban status
    - Check ban_status and ban_expires_at fields in all collection rules
    - _Requirements: 9.14_

  - [ ]* 3.17 Write property test for banned user access denial
    - **Property 42: Banned User Access Denial**
    - **Validates: Requirements 9.14**

- [ ] 4. Checkpoint - Ensure Security Rules tests pass
  - Ensure all tests pass, ask the user if questions arise.


- [ ] 5. Implement User profile management functions
  - [x] 5.1 Create user document creation and update functions
    - Implement createUser function with all required fields and timestamp initialization
    - Implement updateUser function with updated_at timestamp update
    - Add support for optional student, professional, and identity verification fields
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [ ]* 5.2 Write property tests for user profile management
    - **Property 2: Conditional Field Storage for Student Verification**
    - **Property 3: Conditional Field Storage for Professional Verification**
    - **Property 4: Conditional Field Storage for Identity Verification**
    - **Property 5: Verification Badges Array Storage**
    - **Property 6: Timestamp Update on Modification**
    - **Validates: Requirements 1.2, 1.3, 1.4, 1.5, 1.6**

  - [ ]* 5.3 Write unit tests for user profile edge cases
    - Test user creation with all verification types
    - Test user update preserving created_at
    - Test missing required fields rejection
    - _Requirements: 1.1, 1.6, 11.5_

- [ ] 6. Implement verification system functions
  - [x] 6.1 Create verification document submission functions
    - Implement submitVerification function with status defaulting to "pending"
    - Add support for document_url storage and verification_type enum
    - Implement biometric verification with selfie_url and liveness_check_result
    - _Requirements: 2.1, 2.2, 2.4_

  - [x] 6.2 Create admin verification review functions
    - Implement reviewVerification function for admins to approve/reject
    - Update reviewed_at timestamp and reviewer_id on review
    - Add verification attempt to user's verification_history subcollection
    - _Requirements: 2.3, 2.5_

  - [ ]* 6.3 Write property tests for verification system
    - **Property 7: Verification Status Default**
    - **Property 8: Admin Review Updates Verification**
    - **Property 9: Biometric Verification Fields**
    - **Property 10: Verification History Tracking**
    - **Validates: Requirements 2.2, 2.3, 2.4, 2.5**

  - [ ]* 6.4 Write unit tests for verification workflows
    - Test verification submission with pending status
    - Test admin approval updating user verification_badges
    - Test admin rejection with reason
    - _Requirements: 2.2, 2.3_

- [ ] 7. Implement listing management functions
  - [x] 7.1 Create listing CRUD functions
    - Implement createListing with all required fields, timestamp initialization, and status defaulting to "active"
    - Implement updateListing with updated_at timestamp update
    - Implement deleteListing (soft delete by setting status to "deleted")
    - Add validation for images array size (max 10) and coordinate ranges
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6, 3.7_

  - [ ]* 7.2 Write property tests for listing management
    - **Property 12: Nested Object Structure Preservation (preferences)**
    - **Property 13: Array Size Constraint (images)**
    - **Property 6: Timestamp Update on Modification**
    - **Validates: Requirements 3.3, 3.4, 3.6**

  - [ ]* 7.3 Write unit tests for listing operations
    - Test listing creation with all fields
    - Test listing update preserving created_at
    - Test soft delete setting status to "deleted"
    - Test images array exceeding 10 items rejection
    - _Requirements: 3.1, 3.4, 3.6, 3.7_

- [ ] 8. Implement room request management functions
  - [x] 8.1 Create room request CRUD functions
    - Implement createRoomRequest with all required fields and timestamp initialization
    - Add emergency request logic: set expires_at to 3 days after created_at when request_type is "emergency"
    - Implement updateRoomRequest with updated_at timestamp update
    - Implement deleteRoomRequest (soft delete by setting status to "deleted")
    - _Requirements: 4.1, 4.2, 4.3, 4.6_

  - [ ]* 8.2 Write property tests for room request management
    - **Property 14: Emergency Request Expiration Calculation**
    - **Property 12: Nested Object Structure Preservation (preferences)**
    - **Validates: Requirements 4.2, 4.6**

  - [ ]* 8.3 Write unit tests for room request operations
    - Test normal request creation
    - Test emergency request with expires_at set to exactly 3 days
    - Test request update preserving created_at
    - Test soft delete setting status to "deleted"
    - _Requirements: 4.1, 4.2, 4.3_

- [ ] 9. Checkpoint - Ensure core CRUD operations tests pass
  - Ensure all tests pass, ask the user if questions arise.


- [ ] 10. Implement Cloud Function: calculateMatchScores
  - [ ] 10.1 Create match score calculation algorithm
    - Implement calculateMatchScore function with education, college, profession, hometown, gender, proximity, and verification badge scoring
    - Calculate component scores (education_score, college_score, profession_score, hometown_score, proximity_score) each 0-100
    - Calculate overall_score as weighted sum capped at 100
    - Add distance calculation helper using latitude/longitude
    - _Requirements: 5.1, 5.2_

  - [ ] 10.2 Create Cloud Function trigger for new listings and requests
    - Implement onCreate trigger for listings collection
    - Implement onCreate trigger for room_requests collection
    - Query relevant users/listings and calculate match scores
    - Write match score documents to match_scores collection with calculated_at timestamp
    - _Requirements: 5.1, 5.3_

  - [ ] 10.3 Implement match score recalculation on criteria changes
    - Implement onUpdate trigger for users collection (when matching-relevant fields change)
    - Implement onUpdate trigger for listings collection (when preferences change)
    - Query affected match_scores and recalculate with updated calculated_at
    - _Requirements: 5.4_

  - [ ]* 10.4 Write property tests for match score calculation
    - **Property 16: Score Range Validation**
    - **Property 17: Match Score Recalculation on Criteria Change**
    - **Validates: Requirements 5.2, 5.4**

  - [ ]* 10.5 Write unit tests for match score scenarios
    - Test perfect match (same college, profession, hometown) scores 100
    - Test no match scores appropriately low
    - Test proximity scoring decreases with distance
    - Test verification badge bonus calculation
    - _Requirements: 5.1, 5.2_

- [ ] 11. Implement matching criteria and query functions
  - [ ] 11.1 Create matching criteria subcollection management
    - Implement setMatchingCriteria function to store user-specific weights in subcollection
    - Implement getMatchingCriteria function to retrieve weights
    - _Requirements: 5.5_

  - [ ] 11.2 Create personalized feed query function
    - Implement getPersonalizedFeed function querying match_scores by searcher_id
    - Order results by overall_score descending
    - Add pagination support with limit and startAfter
    - _Requirements: 5.6, 12.3_

  - [ ]* 11.3 Write property tests for matching queries
    - **Property 18: Matching Criteria Subcollection Storage**
    - **Property 19: Match Score Query Ordering**
    - **Validates: Requirements 5.5, 5.6**

  - [ ]* 11.4 Write unit tests for personalized feed
    - Test feed returns matches in descending score order
    - Test pagination returns correct page sizes
    - Test empty results when no matches exist
    - _Requirements: 5.6, 12.3_

- [ ] 12. Implement real-time chat system
  - [x] 12.1 Create chat session management functions
    - Implement createChatSession with participant_ids array (exactly 2 unique user_ids)
    - Implement getChatSession and listUserChats functions
    - Add validation for participant_ids array size and uniqueness
    - _Requirements: 6.1, 6.5, 11.7_

  - [x] 12.2 Create message management functions
    - Implement sendMessage function adding message to messages subcollection
    - Update parent ChatSession last_message_at timestamp when message is sent
    - Implement markMessageAsRead function updating read_status
    - _Requirements: 6.2, 6.3_

  - [x] 12.3 Implement chat blocking functionality
    - Implement blockChat function updating ChatSession status
    - Handle status transitions: active → blocked_by_user1/user2, blocked_by_user1 → blocked_by_both
    - _Requirements: 6.6, 6.7_

  - [ ]* 12.4 Write property tests for chat system
    - **Property 20: Chat Last Message Timestamp Update**
    - **Property 22: Chat Blocking Status Update**
    - **Property 50: Participant Array Validation**
    - **Validates: Requirements 6.3, 6.7, 11.7**

  - [ ]* 12.5 Write unit tests for chat operations
    - Test chat session creation with 2 participants
    - Test message sending updates last_message_at
    - Test blocking updates status correctly
    - Test participant_ids validation rejects invalid arrays
    - _Requirements: 6.1, 6.2, 6.3, 6.7, 11.7_

- [ ] 13. Implement real-time listeners and synchronization
  - [ ] 13.1 Create real-time listener setup functions
    - Implement setupChatListener for messages subcollection
    - Implement setupNotificationListener for user notifications
    - Implement setupVerificationListener for user verification status
    - Add automatic reconnection handling on network interruption
    - _Requirements: 10.1, 10.2, 10.5_

  - [ ]* 13.2 Write property tests for real-time synchronization
    - **Property 21: Real-Time Message Delivery**
    - **Property 43: Real-Time Document Updates**
    - **Validates: Requirements 10.1, 10.2, 10.4, 10.6**

  - [ ]* 13.3 Write unit tests for listener behavior
    - Test listener receives new messages immediately
    - Test listener receives document updates
    - Test listener reconnects after network interruption
    - _Requirements: 10.1, 10.2, 10.5_

- [ ] 14. Checkpoint - Ensure real-time features tests pass
  - Ensure all tests pass, ask the user if questions arise.


- [ ] 15. Implement rating and review system
  - [x] 15.1 Create rating submission functions
    - Implement submitRating function with stars validation (1-5 range)
    - Add uniqueness check for reviewer_id + reviewee_id + listing_id combination
    - Set status to "active" by default
    - _Requirements: 7.1, 7.2, 7.5, 9.10_

  - [ ] 15.2 Implement Cloud Function: updateAggregateRatings
    - Create onCreate and onUpdate triggers for ratings collection
    - Query all active ratings for reviewee_id
    - Calculate average_rating, total_ratings, and rating_distribution
    - Update reviewee User document with new aggregate statistics
    - _Requirements: 7.3, 7.4_

  - [x] 15.3 Implement rating moderation functions
    - Implement flagRating function for users to flag inappropriate reviews
    - Implement removeRating function for admins to set status to "removed"
    - Trigger aggregate recalculation when rating is removed
    - _Requirements: 7.5, 7.6, 7.7_

  - [ ]* 15.4 Write property tests for rating system
    - **Property 23: Rating Stars Range Validation**
    - **Property 24: Aggregate Rating Statistics Storage**
    - **Property 25: Aggregate Rating Recalculation**
    - **Property 26: Rating Removal and Recalculation**
    - **Validates: Requirements 7.2, 7.3, 7.4, 7.7, 11.6**

  - [ ]* 15.5 Write unit tests for rating operations
    - Test rating submission with valid stars (1-5)
    - Test rating submission with invalid stars rejected
    - Test duplicate rating rejection
    - Test aggregate recalculation after new rating
    - Test aggregate recalculation after rating removal
    - _Requirements: 7.1, 7.2, 7.4, 7.7, 9.10_

- [ ] 16. Implement report and safety system
  - [x] 16.1 Create report submission functions
    - Implement submitReport function with report_type validation
    - Set status to "pending" by default
    - Store evidence_urls array
    - Add report to reported user's moderation_history subcollection
    - _Requirements: 8.1, 8.2, 8.3, 8.6_

  - [x] 16.2 Create admin report review functions
    - Implement reviewReport function for admins to update status
    - Update reviewed_at, reviewer_id, and action_taken fields
    - Implement banUser function to set ban_status, ban_reason, and ban_expires_at
    - _Requirements: 8.4, 8.5, 8.7_

  - [ ]* 16.3 Write property tests for report system
    - **Property 27: Admin Report Review Updates**
    - **Property 28: Moderation History Tracking**
    - **Property 29: Ban Fields Storage**
    - **Validates: Requirements 8.5, 8.6, 8.7**

  - [ ]* 16.4 Write unit tests for report operations
    - Test report submission with pending status
    - Test admin review updates all required fields
    - Test moderation_history subcollection tracking
    - Test ban_expires_at is future timestamp
    - _Requirements: 8.1, 8.3, 8.5, 8.6, 8.7_

- [ ] 17. Implement notification system
  - [x] 17.1 Create notification management functions
    - Implement createNotification function with type validation
    - Set read_status to false by default
    - Add optional expires_at timestamp
    - _Requirements: 15.1, 15.2, 15.4_

  - [ ] 17.2 Implement Cloud Function: generateNotifications
    - Create triggers for various events (new match, chat message, verification status change)
    - Generate appropriate notification documents with type-specific content
    - Set related_id to reference the triggering entity
    - _Requirements: 10.3, 15.3_

  - [x] 17.3 Create notification query and update functions
    - Implement getUserNotifications function querying by user_id and ordering by created_at descending
    - Implement markNotificationAsRead function updating read_status
    - Add pagination support
    - _Requirements: 15.5, 12.6_

  - [ ] 17.4 Implement Cloud Function: cleanupExpiredNotifications
    - Create scheduled function running daily
    - Query notifications where expires_at < current timestamp
    - Batch delete expired notifications
    - _Requirements: 15.6_

  - [ ]* 17.5 Write property tests for notification system
    - **Property 44: Notification Generation on Match**
    - **Property 55: Notification Default Read Status**
    - **Property 56: Notification Read Status Update**
    - **Property 57: Expired Notification Cleanup**
    - **Property 58: Real-Time Notification Delivery**
    - **Validates: Requirements 10.3, 15.4, 15.5, 15.6, 15.7**

  - [ ]* 17.6 Write unit tests for notification operations
    - Test notification creation with default read_status false
    - Test notification read status update
    - Test expired notification cleanup
    - Test notification generation on match creation
    - _Requirements: 15.1, 15.4, 15.5, 15.6, 10.3_

- [ ] 18. Implement Cloud Function: expireEmergencyRequests
  - [ ] 18.1 Create scheduled expiration function
    - Implement scheduled function running every hour
    - Query room_requests where status='active' and expires_at < current timestamp
    - Batch update status to 'expired'
    - Generate notifications for affected users
    - _Requirements: 4.5, 10.4_

  - [ ]* 18.2 Write property test for automated expiration
    - **Property 15: Automated Expiration Status Update**
    - **Validates: Requirements 4.5**

  - [ ]* 18.3 Write unit tests for expiration function
    - Test expired requests updated to 'expired' status
    - Test active requests with future expires_at not affected
    - Test notification generated for expired request
    - _Requirements: 4.5, 10.4_

- [ ] 19. Checkpoint - Ensure all Cloud Functions tests pass
  - Ensure all tests pass, ask the user if questions arise.


- [ ] 20. Implement analytics and statistics tracking
  - [ ] 20.1 Create analytics event logging functions
    - Implement logAnalyticsEvent function with event_type validation
    - Store user_id, session_id, metadata, and timestamp
    - Support event types: listing_view, search_performed, chat_initiated, rating_submitted, report_filed
    - _Requirements: 14.1, 14.2_

  - [ ] 20.2 Create daily statistics aggregation function
    - Implement scheduled function running daily at midnight
    - Aggregate counts for total_users, active_users, new_listings, new_requests, total_chats, total_reports
    - Calculate performance metrics (avg_query_latency_ms, read/write operation counts)
    - Write to daily_stats collection with date as document ID (YYYY-MM-DD format)
    - _Requirements: 14.3, 14.6_

  - [ ] 20.3 Create statistics query functions
    - Implement getStatsByDateRange function querying daily_stats by date range
    - Order results by date
    - Support trend analysis queries
    - _Requirements: 14.4, 14.5_

  - [ ]* 20.4 Write property tests for analytics system
    - **Property 54: Time-Series Query Ordering**
    - **Validates: Requirements 14.5**

  - [ ]* 20.5 Write unit tests for analytics operations
    - Test analytics event logging with all event types
    - Test daily stats aggregation calculates correct counts
    - Test date range query returns ordered results
    - _Requirements: 14.1, 14.2, 14.3, 14.5_

- [ ] 21. Implement query optimization with composite indexes
  - [ ] 21.1 Define composite indexes in firestore.indexes.json
    - Add index for listings: city + listing_type + status + created_at
    - Add index for listings: poster_id + status
    - Add index for listings: city + status + available_from
    - Add index for room_requests: city + request_type + status + created_at
    - Add index for room_requests: searcher_id + status
    - Add index for room_requests: status + expires_at
    - Add index for match_scores: searcher_id + overall_score (descending)
    - Add index for match_scores: listing_id + overall_score (descending)
    - Add index for chats: participant_ids (array-contains) + last_message_at (descending)
    - Add index for ratings: reviewee_id + status + created_at
    - Add index for ratings: reviewer_id + reviewee_id + listing_id (uniqueness)
    - Add index for reports: status + created_at
    - Add index for reports: reported_user_id + status
    - Add index for notifications: user_id + read_status + created_at (descending)
    - Add index for notifications: expires_at
    - Add index for analytics: user_id + timestamp
    - Add index for analytics: event_type + timestamp
    - Add index for verifications: user_id + status
    - Add index for verifications: status + submitted_at
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 1.7, 2.6, 3.5, 4.4_

  - [ ]* 21.2 Write unit tests for query performance
    - Test listing search by city and type uses index
    - Test personalized feed query uses index
    - Test chat list query uses index
    - Test report queue query uses index
    - _Requirements: 12.1, 12.2, 12.3, 12.5_

- [ ] 22. Implement data export and backup functions
  - [ ] 22.1 Create collection export functions
    - Implement exportCollection function to export any collection to JSON
    - Include all documents with all fields
    - Support subcollection export
    - _Requirements: 13.1, 13.4_

  - [ ] 22.2 Create data import functions
    - Implement importCollection function to restore from JSON export
    - Validate data structure before import
    - Support batch writes for large imports
    - _Requirements: 13.2_

  - [ ] 22.3 Create backup scheduling function
    - Implement scheduled function for automated backups
    - Export all collections to Cloud Storage
    - Implement retention policy (keep last 30 days)
    - _Requirements: 13.3_

  - [ ]* 22.4 Write property test for export completeness
    - **Property 53: Collection Export Completeness**
    - **Validates: Requirements 13.4**

  - [ ]* 22.5 Write unit tests for backup operations
    - Test export includes all documents and fields
    - Test import restores data correctly
    - Test backup creates files in Cloud Storage
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

- [ ] 23. Implement pagination support for all query functions
  - [ ] 23.1 Add pagination to listing and request queries
    - Update search functions to accept limit and startAfter parameters
    - Return pagination metadata (hasMore, lastDocument)
    - _Requirements: 12.6_

  - [ ] 23.2 Add pagination to chat, rating, and notification queries
    - Update query functions to support page size limits
    - Implement cursor-based pagination with startAfter
    - _Requirements: 12.6_

  - [ ]* 23.3 Write property test for query pagination
    - **Property 52: Query Pagination**
    - **Validates: Requirements 12.6**

  - [ ]* 23.4 Write unit tests for pagination
    - Test pagination returns correct page sizes
    - Test iterating through all pages returns all documents exactly once
    - Test empty results when no more pages
    - _Requirements: 12.6_

- [ ] 24. Final integration and wiring
  - [ ] 24.1 Wire all Cloud Functions together
    - Deploy all Cloud Functions with proper triggers
    - Configure function timeouts and memory limits
    - Set up function environment variables
    - _Requirements: All Cloud Function requirements_

  - [ ] 24.2 Create client SDK wrapper functions
    - Create high-level API functions wrapping Firestore operations
    - Add error handling and retry logic
    - Implement optimistic updates for better UX
    - _Requirements: All requirements_

  - [ ] 24.3 Set up monitoring and logging
    - Configure Cloud Functions logging
    - Set up error alerting for critical failures
    - Add performance monitoring for slow queries
    - _Requirements: 14.6_

  - [ ]* 24.4 Write integration tests for end-to-end flows
    - Test complete user registration and verification flow
    - Test listing creation, matching, and chat initiation flow
    - Test rating submission and aggregate update flow
    - Test report submission and admin review flow
    - _Requirements: All requirements_

- [ ] 25. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at major milestones
- Property tests validate universal correctness properties across all inputs
- Unit tests validate specific examples, edge cases, and integration points
- All code examples use TypeScript with Firebase Admin SDK
- Testing uses fast-check for property-based tests and Jest for unit tests
- Firebase Emulator Suite should be used for all local development and testing

// Firebase Firestore TypeScript interfaces
import { Timestamp } from 'firebase/firestore';

/**
 * User document stored in the "users" collection
 * Represents a registered platform member (searcher, poster, or both)
 */
export interface UserDocument {
  user_id: string;              // Primary identifier
  name: string;
  age: number;                  // Constraint: 18-100
  gender: 'male' | 'female' | 'other';
  phone: string;                // Constraint: 10 digits
  email: string;                // Constraint: Valid email format
  city: string;
  home_district: string;
  user_type: 'searcher' | 'poster' | 'both';
  
  // Student verification fields (optional)
  college?: string;
  course?: string;
  year?: number;
  student_id_url?: string;
  
  // Professional verification fields (optional)
  company?: string;
  role?: string;
  professional_id_url?: string;
  
  // Identity verification fields
  aadhaar_verified: boolean;
  pan_verified: boolean;
  selfie_url?: string;
  verification_status: 'unverified' | 'pending' | 'verified' | 'rejected';
  verification_badges: string[]; // ['student', 'professional', 'identity']
  
  // Aggregate statistics
  average_rating: number;
  total_ratings: number;
  rating_distribution: { [key: number]: number }; // {5: 10, 4: 5, ...}
  
  // Moderation fields
  ban_status: 'none' | 'active';
  ban_reason?: string;
  ban_expires_at?: Timestamp;
  
  // Timestamps
  created_at: Timestamp;
  updated_at: Timestamp;
}

/**
 * Verification document stored in the "verifications" collection
 * Tracks verification document submissions and review status
 */
export interface VerificationDocument {
  verification_id: string;
  user_id: string;
  verification_type: 'student' | 'professional' | 'aadhaar' | 'pan' | 'selfie';
  document_url: string;         // Cloud Storage URL
  status: 'pending' | 'approved' | 'rejected';
  
  // Biometric verification fields (for selfie type)
  liveness_check_result?: boolean;
  
  // Review information
  submitted_at: Timestamp;
  reviewed_at?: Timestamp;
  reviewer_id?: string;         // Admin user_id
  rejection_reason?: string;
  
  created_at: Timestamp;
}

/**
 * Listing document stored in the "listings" collection
 * Represents accommodation offerings from posters
 */
export interface ListingDocument {
  listing_id: string;
  poster_id: string;
  title: string;
  description: string;
  listing_type: 'long_term' | 'pg' | 'flatmate' | 'short_stay' | 'emergency';
  room_type?: string;           // '1rk' | '1bhk' | '2bhk' | '3bhk' | '4bhk' | 'studio' | 'shared' | 'single'
  
  // Pricing
  rent_amount: number;          // Constraint: Positive number
  deposit_amount: number;
  
  // Availability
  available_from: Timestamp;
  
  // Location
  location: string;             // Address
  city: string;
  latitude: number;             // Constraint: -90 to 90
  longitude: number;            // Constraint: -180 to 180
  
  // Details
  amenities: string[];          // ['wifi', 'parking', 'kitchen', ...]
  preferences: {
    gender_preference?: 'male' | 'female' | 'any';
    furnishing?: 'furnished' | 'semi-furnished' | 'unfurnished';
    profession_preference?: string[];
    other_requirements?: string;
  };
  
  // Media
  images: string[];             // Constraint: Max 10 Cloud Storage URLs
  
  // Status
  status: 'active' | 'inactive' | 'rented' | 'deleted';
  
  // Timestamps
  created_at: Timestamp;
  updated_at: Timestamp;
}

/**
 * Room request document stored in the "room_requests" collection
 * Represents accommodation needs from searchers
 */
export interface RoomRequestDocument {
  request_id: string;
  searcher_id: string;
  title: string;
  description: string;
  
  // Timeline
  needed_from: Timestamp;
  needed_until: Timestamp;
  request_type: 'normal' | 'emergency';
  expires_at?: Timestamp;       // Set for emergency requests (3 days)
  
  // Budget
  budget_min: number;           // Constraint: Positive number
  budget_max: number;
  
  // Location
  city: string;
  location?: string;
  latitude?: number;
  longitude?: number;

  // Duration (short-hand stored alongside needed_from/needed_until)
  duration?: string;
  
  // Preferences
  preferences: {
    gender_preference?: 'any' | 'male' | 'female';
    location_preference?: string;
    amenities_required?: string[];
    other_requirements?: string;
  };
  
  // Status
  status: 'active' | 'fulfilled' | 'expired' | 'deleted';
  
  // Timestamps
  created_at: Timestamp;
  updated_at: Timestamp;
}

/**
 * Match score document stored in the "match_scores" collection
 * Represents calculated compatibility scores between searchers and listings
 */
export interface MatchScoreDocument {
  match_id: string;
  searcher_id: string;
  listing_id: string;
  
  // Score components (0-100)
  overall_score: number;
  education_score: number;
  college_score: number;
  profession_score: number;
  hometown_score: number;
  gender_match: boolean;
  proximity_score: number;
  
  // Metadata
  calculated_at: Timestamp;
}

/**
 * Chat session document stored in the "chats" collection
 * Represents a conversation between two users
 */
export interface ChatSessionDocument {
  chat_id: string;
  participant_ids: [string, string]; // Constraint: Exactly 2 user_ids
  status: 'active' | 'blocked_by_user1' | 'blocked_by_user2' | 'blocked_by_both';
  
  // Timestamps
  created_at: Timestamp;
  last_message_at: Timestamp;

  // Last message preview (written by sendMessage, used for notifications)
  last_message_sender_id?: string;
  last_message_preview?: string;
}

/**
 * Message document stored in the "messages" subcollection under chat sessions
 * Represents individual messages in a chat
 */
export interface MessageDocument {
  message_id: string;
  sender_id: string;
  text: string;
  message_type: 'text' | 'system';
  read_status: boolean;
  timestamp: Timestamp;
}

/**
 * Rating document stored in the "ratings" collection
 * Represents user reviews and ratings
 */
export interface RatingDocument {
  rating_id: string;
  reviewer_id: string;
  reviewee_id: string;
  listing_id?: string;          // Optional reference to listing
  
  // Rating content
  stars: number;                // Constraint: 1-5
  review_text?: string;
  
  // Moderation
  status: 'active' | 'flagged' | 'removed';
  admin_notes?: string;
  
  // Timestamps
  created_at: Timestamp;
}

/**
 * Report document stored in the "reports" collection
 * Represents safety concern reports for admin review
 */
export interface ReportDocument {
  report_id: string;
  reporter_id: string;
  reported_user_id: string;
  report_type: 'fake_identity' | 'broker' | 'scam' | 'harassment';
  description: string;
  evidence_urls: string[];      // Cloud Storage URLs
  
  // Review status
  status: 'pending' | 'under_review' | 'resolved' | 'dismissed';
  reviewed_at?: Timestamp;
  reviewer_id?: string;         // Admin user_id
  action_taken?: string;
  
  // Timestamps
  created_at: Timestamp;
}

/**
 * Notification document stored in the "notifications" collection
 * Represents user notifications for platform activities
 */
export interface NotificationDocument {
  notification_id: string;
  user_id: string;
  type: 'new_match' | 'chat_message' | 'verification_approved' | 'listing_expired' | 'request_response';
  title: string;
  message: string;
  related_id?: string;          // ID of related entity
  read_status: boolean;
  
  // Timestamps
  created_at: Timestamp;
  expires_at?: Timestamp;       // Auto-delete after expiry
}

/**
 * Analytics event document stored in the "analytics" collection
 * Tracks user behavior and platform events
 */
export interface AnalyticsEventDocument {
  event_id: string;
  event_type: 'listing_view' | 'search_performed' | 'chat_initiated' | 'rating_submitted' | 'report_filed';
  user_id: string;
  session_id: string;
  metadata: { [key: string]: any }; // Event-specific data
  timestamp: Timestamp;
}

/**
 * Daily stats document stored in the "daily_stats" collection
 * Represents aggregated daily platform statistics
 */
export interface DailyStatsDocument {
  date: string;                 // YYYY-MM-DD format
  total_users: number;
  active_users: number;
  new_listings: number;
  new_requests: number;
  total_chats: number;
  total_reports: number;
  
  // Performance metrics
  avg_query_latency_ms: number;
  total_read_operations: number;
  total_write_operations: number;
}

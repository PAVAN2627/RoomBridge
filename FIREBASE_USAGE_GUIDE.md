# Firebase Database Integration - Usage Guide

## Overview

This guide provides examples of how to use the Firebase database integration functions in your RoomBridge application.

## Table of Contents

1. [User Management](#user-management)
2. [Verification System](#verification-system)
3. [Listing Management](#listing-management)
4. [Room Requests](#room-requests)
5. [Chat System](#chat-system)
6. [Rating System](#rating-system)
7. [Report System](#report-system)
8. [Notifications](#notifications)

---

## User Management

### Create a New User

```typescript
import { createUser } from '@/lib/firebase';
import { Timestamp } from 'firebase/firestore';

const newUser = await createUser('user123', {
  name: 'John Doe',
  age: 25,
  gender: 'male',
  phone: '9876543210',
  email: 'john@example.com',
  city: 'Mumbai',
  home_district: 'Mumbai Suburban',
  user_type: 'both', // 'searcher', 'poster', or 'both'
  aadhaar_verified: false,
  pan_verified: false,
  verification_status: 'unverified',
  verification_badges: [],
});
```

### Update User Profile

```typescript
import { updateUser } from '@/lib/firebase';

await updateUser('user123', {
  name: 'John Smith',
  city: 'Delhi',
});
```

### Add Student Verification

```typescript
import { updateStudentVerification } from '@/lib/firebase';

await updateStudentVerification('user123', {
  college: 'IIT Mumbai',
  course: 'Computer Science',
  year: 3,
  student_id_url: 'https://storage.googleapis.com/...',
});
```

### Add Professional Verification

```typescript
import { updateProfessionalVerification } from '@/lib/firebase';

await updateProfessionalVerification('user123', {
  company: 'Tech Corp',
  role: 'Software Engineer',
  professional_id_url: 'https://storage.googleapis.com/...',
});
```

---

## Verification System

### Submit Verification Document

```typescript
import { submitVerification } from '@/lib/firebase';

const verification = await submitVerification(
  'user123',
  'aadhaar', // 'student', 'professional', 'aadhaar', 'pan', 'selfie'
  'https://storage.googleapis.com/aadhaar-doc.jpg'
);
```

### Submit Selfie with Liveness Check

```typescript
const verification = await submitVerification(
  'user123',
  'selfie',
  'https://storage.googleapis.com/selfie.jpg',
  true // liveness check result
);
```

### Admin: Review Verification

```typescript
import { reviewVerification } from '@/lib/firebase';

// Approve verification
await reviewVerification(
  'verification123',
  'admin456',
  true // approved
);

// Reject verification
await reviewVerification(
  'verification123',
  'admin456',
  false, // rejected
  'Document is not clear'
);
```

### Get Pending Verifications (Admin)

```typescript
import { getPendingVerifications } from '@/lib/firebase';

const pendingVerifications = await getPendingVerifications();
```

---

## Listing Management

### Create a Listing

```typescript
import { createListing } from '@/lib/firebase';
import { Timestamp } from 'firebase/firestore';

const listing = await createListing('user123', {
  title: 'Spacious 2BHK in Andheri',
  description: 'Well-maintained apartment with modern amenities...',
  listing_type: 'long_term', // 'long_term', 'pg', 'flatmate', 'short_stay', 'emergency'
  rent_amount: 25000,
  deposit_amount: 50000,
  available_from: Timestamp.now(),
  location: 'Andheri West, Mumbai',
  city: 'Mumbai',
  latitude: 19.1136,
  longitude: 72.8697,
  amenities: ['wifi', 'parking', 'gym', 'kitchen'],
  preferences: {
    gender_preference: 'any', // 'male', 'female', 'any'
    profession_preference: ['student', 'professional'],
    other_requirements: 'Non-smoker preferred',
  },
  images: [
    'https://storage.googleapis.com/img1.jpg',
    'https://storage.googleapis.com/img2.jpg',
  ],
});
```

### Update a Listing

```typescript
import { updateListing } from '@/lib/firebase';

await updateListing('listing123', {
  rent_amount: 23000,
  description: 'Updated description...',
});
```

### Search Listings

```typescript
import { searchListings } from '@/lib/firebase';

const listings = await searchListings(
  'Mumbai', // city
  'pg', // optional listing type
  20 // limit
);
```

### Mark Listing as Rented

```typescript
import { markListingAsRented } from '@/lib/firebase';

await markListingAsRented('listing123');
```

### Soft Delete a Listing

```typescript
import { deleteListing } from '@/lib/firebase';

await deleteListing('listing123');
```

---

## Room Requests

### Create a Room Request

```typescript
import { createRoomRequest } from '@/lib/firebase';
import { Timestamp } from 'firebase/firestore';

const request = await createRoomRequest('user123', {
  title: 'Looking for PG in Andheri',
  description: 'Need a clean PG with wifi...',
  needed_from: Timestamp.fromDate(new Date('2024-03-01')),
  needed_until: Timestamp.fromDate(new Date('2024-08-31')),
  request_type: 'normal', // 'normal' or 'emergency'
  budget_min: 8000,
  budget_max: 12000,
  city: 'Mumbai',
  preferences: {
    location_preference: 'Near metro station',
    amenities_required: ['wifi', 'food'],
    other_requirements: 'Vegetarian food only',
  },
});
```

### Create Emergency Request (Auto-expires in 3 days)

```typescript
const emergencyRequest = await createRoomRequest('user123', {
  title: 'Urgent: Need room for exam',
  description: 'Need accommodation for 2 days...',
  needed_from: Timestamp.now(),
  needed_until: Timestamp.fromMillis(Date.now() + 2 * 24 * 60 * 60 * 1000),
  request_type: 'emergency', // Will auto-expire in 3 days
  budget_min: 500,
  budget_max: 1000,
  city: 'Mumbai',
  preferences: {},
});
```

### Search Room Requests

```typescript
import { searchRoomRequests } from '@/lib/firebase';

const requests = await searchRoomRequests(
  'Mumbai', // city
  'emergency', // optional request type
  20 // limit
);
```

### Mark Request as Fulfilled

```typescript
import { markRequestAsFulfilled } from '@/lib/firebase';

await markRequestAsFulfilled('request123');
```

---

## Chat System

### Create a Chat Session

```typescript
import { createChatSession } from '@/lib/firebase';

const chat = await createChatSession('user1', 'user2');
```

### Send a Message

```typescript
import { sendMessage } from '@/lib/firebase';

const message = await sendMessage(
  'chat123',
  'user1',
  'Hello! Is the room still available?'
);
```

### Get Messages

```typescript
import { getMessages } from '@/lib/firebase';

const messages = await getMessages('chat123', 50); // limit 50
```

### Mark Message as Read

```typescript
import { markMessageAsRead } from '@/lib/firebase';

await markMessageAsRead('chat123', 'message456');
```

### Block a Chat

```typescript
import { blockChat } from '@/lib/firebase';

await blockChat('chat123', 'user1');
```

### Set Up Real-Time Chat Listener

```typescript
import { setupChatListener } from '@/lib/firebase';

const unsubscribe = setupChatListener('chat123', (messages) => {
  console.log('New messages:', messages);
  // Update UI with new messages
});

// Later, stop listening
unsubscribe();
```

### List User's Chats

```typescript
import { listUserChats } from '@/lib/firebase';

const chats = await listUserChats('user123');
```

---

## Rating System

### Submit a Rating

```typescript
import { submitRating } from '@/lib/firebase';

const rating = await submitRating(
  'reviewer123', // reviewer ID
  'reviewee456', // reviewee ID
  5, // stars (1-5)
  'Great roommate! Very clean and respectful.', // optional review text
  'listing789' // optional listing ID
);
```

### Get User Ratings

```typescript
import { getUserRatings } from '@/lib/firebase';

const ratings = await getUserRatings('user123', 20); // limit 20
```

### Flag a Rating

```typescript
import { flagRating } from '@/lib/firebase';

await flagRating('rating123');
```

### Admin: Remove a Rating

```typescript
import { removeRating } from '@/lib/firebase';

await removeRating('rating123', 'Inappropriate content');
```

### Admin: Get Flagged Ratings

```typescript
import { getFlaggedRatings } from '@/lib/firebase';

const flaggedRatings = await getFlaggedRatings();
```

---

## Report System

### Submit a Report

```typescript
import { submitReport } from '@/lib/firebase';

const report = await submitReport(
  'reporter123',
  'reported456',
  'scam', // 'fake_identity', 'broker', 'scam', 'harassment'
  'This user is asking for advance payment without showing the room',
  ['https://storage.googleapis.com/evidence1.jpg'] // evidence URLs
);
```

### Admin: Review a Report

```typescript
import { reviewReport } from '@/lib/firebase';

await reviewReport(
  'report123',
  'admin456',
  'resolved', // 'under_review', 'resolved', 'dismissed'
  'User has been warned and listing removed'
);
```

### Admin: Ban a User

```typescript
import { banUser } from '@/lib/firebase';

// Temporary ban (7 days)
await banUser('user123', 'Repeated policy violations', 7);

// Permanent ban
await banUser('user123', 'Fraudulent activity', 0);
```

### Admin: Unban a User

```typescript
import { unbanUser } from '@/lib/firebase';

await unbanUser('user123');
```

### Admin: Get Pending Reports

```typescript
import { getPendingReports } from '@/lib/firebase';

const pendingReports = await getPendingReports();
```

### Admin: Get User Report Statistics

```typescript
import { getUserReportStats } from '@/lib/firebase';

const stats = await getUserReportStats('user123');
// Returns: { total, pending, resolved, dismissed, byType }
```

---

## Notifications

### Get User Notifications

```typescript
import { getUserNotifications } from '@/lib/firebase';

// Get all notifications
const allNotifications = await getUserNotifications('user123', 20);

// Get only unread notifications
const unreadNotifications = await getUserNotifications('user123', 20, true);
```

### Mark Notification as Read

```typescript
import { markNotificationAsRead } from '@/lib/firebase';

await markNotificationAsRead('notification123');
```

### Mark All Notifications as Read

```typescript
import { markAllNotificationsAsRead } from '@/lib/firebase';

await markAllNotificationsAsRead('user123');
```

### Get Unread Count

```typescript
import { getUnreadNotificationCount } from '@/lib/firebase';

const unreadCount = await getUnreadNotificationCount('user123');
```

### Set Up Real-Time Notification Listener

```typescript
import { setupNotificationListener } from '@/lib/firebase';

const unsubscribe = setupNotificationListener('user123', (notifications) => {
  console.log('Notifications updated:', notifications);
  // Update UI with new notifications
});

// Later, stop listening
unsubscribe();
```

### Create Notifications (Typically done by Cloud Functions)

```typescript
import { NotificationHelpers } from '@/lib/firebase';

// New match notification
await NotificationHelpers.newMatch('user123', 'listing456', 85);

// Chat message notification
await NotificationHelpers.chatMessage('user123', 'chat456', 'John Doe');

// Verification approved notification
await NotificationHelpers.verificationApproved('user123', 'student');

// Listing expired notification
await NotificationHelpers.listingExpired('user123', 'listing456');

// Request response notification
await NotificationHelpers.requestResponse('user123', 'request456', 'Jane Smith');
```

---

## Error Handling

All functions may throw errors. Always wrap them in try-catch blocks:

```typescript
try {
  const listing = await createListing('user123', listingData);
  console.log('Listing created:', listing);
} catch (error) {
  console.error('Error creating listing:', error);
  // Handle error appropriately
}
```

## Common Error Types

- **Permission Denied**: User doesn't have access to the resource
- **Validation Error**: Data doesn't meet validation requirements
- **Not Found**: Resource doesn't exist
- **Duplicate**: Attempting to create a duplicate resource (e.g., duplicate rating)

---

## Best Practices

1. **Always validate data** before calling Firebase functions
2. **Use TypeScript types** for better type safety
3. **Handle errors gracefully** with try-catch blocks
4. **Clean up listeners** when components unmount
5. **Use pagination** for large result sets
6. **Optimize queries** by using indexes (configured in firestore.indexes.json)
7. **Test with emulators** before deploying to production

---

## Testing with Emulators

Start the Firebase emulators:

```bash
npm run emulators
```

Access the Emulator UI at: http://localhost:4000

---

## Next Steps

1. Implement Cloud Functions for background processing (match scoring, notifications)
2. Set up composite indexes for optimized queries
3. Add comprehensive error handling and logging
4. Implement analytics tracking
5. Set up monitoring and alerts

For more information, see:
- [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) - Setup instructions
- [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) - Implementation progress

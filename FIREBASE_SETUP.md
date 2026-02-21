# Firebase Setup Guide

## Project Configuration

This project uses Firebase for:
- **Firestore**: NoSQL database for all application data
- **Authentication**: User authentication and authorization
- **Cloud Storage**: File storage for verification documents and listing images
- **Cloud Functions**: Background processing and automated tasks
- **Analytics**: Usage tracking and metrics

## Firebase Project Details

- **Project ID**: roombridge-e6a36
- **Project Name**: RoomBridge
- **Region**: Default (us-central1)

## Local Development with Emulators

### Prerequisites

1. Install Firebase CLI globally:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

### Running Emulators

Start all Firebase emulators for local development:

```bash
npm run emulators
```

This will start:
- **Firestore Emulator**: http://localhost:8080
- **Authentication Emulator**: http://localhost:9099
- **Storage Emulator**: http://localhost:9199
- **Functions Emulator**: http://localhost:5001
- **Emulator UI**: http://localhost:4000

### Emulator Data Persistence

Export emulator data:
```bash
npm run emulators:export
```

Import previously exported data:
```bash
npm run emulators:import
```

## Environment Configuration

The Firebase configuration is stored in `src/lib/firebase.ts`. For production deployment, consider using environment variables:

```typescript
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};
```

## Service Account Key

The service account key (`roombridge-e6a36-firebase-adminsdk-fbsvc-10c1cb9482.json`) is used for:
- Admin SDK operations
- Cloud Functions deployment
- Backend services

**⚠️ SECURITY WARNING**: Never commit service account keys to version control. Add to `.gitignore`:

```
# Firebase
roombridge-e6a36-firebase-adminsdk-fbsvc-*.json
.firebase/
firebase-data/
```

## Deployment

### Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### Deploy Firestore Indexes
```bash
firebase deploy --only firestore:indexes
```

### Deploy Storage Rules
```bash
firebase deploy --only storage
```

### Deploy Cloud Functions
```bash
firebase deploy --only functions
```

### Deploy Everything
```bash
firebase deploy
```

## Testing

### Unit Tests
```bash
npm test
```

### Property-Based Tests
Property tests use `fast-check` library and run as part of the test suite.

### Security Rules Testing
Security rules are tested using `@firebase/rules-unit-testing` with the emulator.

## Project Structure

```
├── src/
│   └── lib/
│       └── firebase/
│           ├── types.ts          # TypeScript interfaces for Firestore documents
│           ├── validation.ts     # Validation helper functions
│           └── ...               # Additional Firebase modules
├── firestore.rules               # Firestore Security Rules
├── firestore.indexes.json        # Composite indexes configuration
├── storage.rules                 # Cloud Storage Security Rules
├── firebase.json                 # Firebase project configuration
└── .firebaserc                   # Firebase project aliases
```

## Next Steps

1. ✅ Task 1: Infrastructure setup (COMPLETE)
2. ⏳ Task 2: Implement data models and TypeScript interfaces
3. ⏳ Task 3: Implement Firestore Security Rules
4. ⏳ Task 4-25: Continue with implementation plan

See `.kiro/specs/firebase-database-integration/tasks.md` for the complete implementation plan.

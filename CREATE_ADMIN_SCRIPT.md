# Create Admin User Script

## Option 1: Register Through UI (Recommended)

1. Open the app: http://localhost:8084/register
2. Fill in the registration form:
   - Email: admin@roombridge.com
   - Password: Admin@123
   - Complete all 3 steps
3. After successful registration, go to Firebase Console
4. Add `role: "admin"` field to the user document

## Option 2: Check Firebase Authentication

If the user was created in Firebase Auth but not in Firestore:

1. Go to Firebase Console: https://console.firebase.google.com/u/4/project/roombridge-e6a36/authentication/users
2. Check if admin@roombridge.com exists in Authentication
3. If yes, copy the UID
4. Go to Firestore: https://console.firebase.google.com/u/4/project/roombridge-e6a36/firestore
5. Create a new document in `users` collection with the UID as document ID
6. Add these fields:
   ```
   user_id: <UID>
   name: "Admin"
   email: "admin@roombridge.com"
   age: 30
   gender: "male"
   phone: "0000000000"
   city: "Mumbai"
   home_district: "Mumbai"
   user_type: "both"
   aadhaar_verified: false
   pan_verified: false
   verification_status: "verified"
   verification_badges: ["identity", "selfie"]
   role: "admin"
   average_rating: 0
   total_ratings: 0
   rating_distribution: {}
   ban_status: "none"
   created_at: <current timestamp>
   updated_at: <current timestamp>
   ```

## Option 3: Browser Console Script

If you're logged in as admin@roombridge.com, open browser console (F12) and run:

```javascript
// Get current user
const user = firebase.auth().currentUser;
console.log("Current user:", user);

if (user) {
  // Create user document
  firebase.firestore().collection('users').doc(user.uid).set({
    user_id: user.uid,
    name: "Admin",
    email: "admin@roombridge.com",
    age: 30,
    gender: "male",
    phone: "0000000000",
    city: "Mumbai",
    home_district: "Mumbai",
    user_type: "both",
    aadhaar_verified: false,
    pan_verified: false,
    verification_status: "verified",
    verification_badges: ["identity", "selfie"],
    role: "admin",
    average_rating: 0,
    total_ratings: 0,
    rating_distribution: {},
    ban_status: "none",
    created_at: firebase.firestore.Timestamp.now(),
    updated_at: firebase.firestore.Timestamp.now()
  }).then(() => {
    console.log("Admin user document created successfully!");
  }).catch((error) => {
    console.error("Error creating user document:", error);
  });
} else {
  console.log("No user logged in. Please login first.");
}
```

## Troubleshooting

### If registration fails:
1. Check browser console for errors (F12)
2. Check Firestore rules are deployed: `firebase deploy --only firestore:rules`
3. Check if user exists in Firebase Authentication
4. Try registering with a different email first to test the flow

### If you can't login:
1. Reset password in Firebase Console
2. Or delete the user and register again

### Check Firestore Rules:
Make sure the rules allow user creation:
```
allow create: if isAuthenticated() && isOwner(userId);
```

# Admin Account Setup

## Quick Setup (Recommended)

1. **Go to the Admin Setup page:**
   - Navigate to: http://localhost:8084/admin-setup
   
2. **Click the "Create Admin User" button**
   - This will automatically create the admin user document in Firestore
   - UID: H2gxc0t5peebJQU5FiTEuMQfSq82
   - Email: admin@roombridge.com
   - Password: Admin@123

3. **Login**
   - You'll be redirected to the login page
   - Login with: admin@roombridge.com / Admin@123

4. **Access Admin Dashboard**
   - Navigate to: http://localhost:8084/admin

---

## Manual Setup (Alternative)

If the button doesn't work, follow these steps:

1. Register a new account with the admin email
2. After registration, manually update the user document in Firestore:
   - Go to Firebase Console: https://console.firebase.google.com/u/4/project/roombridge-e6a36/firestore
   - Navigate to `users` collection
   - Find the user with email `admin@roombridge.com`
   - Add a field: `role` = `admin` (string)

---

## Admin Access

Once the role is set, the admin can access:
- `/admin` - Admin dashboard
- All admin routes under `/admin/*`

## Security Note

The admin role is checked in Firestore security rules. Only users with `role: 'admin'` can access admin-only features.

# RoomBridge - Smart Roommate Matching Platform

RoomBridge is an intelligent room rental and roommate matching platform that connects people looking for rooms with those offering them. Built with modern web technologies and powered by AI for smart matching and assistance.

## 🌟 Key Features

### 🤖 AI-Powered Features
- **Smart Chatbot Assistant** - Gemini 2.5 Flash AI chatbot for platform guidance
- **Intelligent Matching** - AI-powered compatibility scoring (0-100%)
- **Smart Feed Sections** - Categorized listings (Emergency, Best Matches, Nearby, Same College, Same Hometown)

### 📍 Location-Based Services
- **Distance Calculation** - Real-time distance to listings using Google Maps
- **Nearby Prioritization** - Listings within 5km get +50 match score boost
- **Auto-Geocoding** - Automatic coordinate generation for all listings

### 🏠 Listing Management
- **Multiple Listing Types** - Long-Term, PG, Short Stay, Emergency, Flatmate
- **Rich Media** - Multiple photos, amenities, preferences
- **Emergency Rooms** - Auto-expire after 3 days with warnings

### 💬 Communication
- **Real-time Messaging** - Chat with room owners and seekers
- **Notifications** - Bell notifications for new messages
- **User Profiles** - View ratings and verification status

### 🔒 Safety & Trust
- **Profile Verification** - Student ID, Aadhaar/PAN, Live Selfie
- **Automated Moderation** - Auto-flagging and temporary blocks
- **Reports System** - Report inappropriate users
- **Ratings & Reviews** - Rate users after interactions

### 👨‍💼 Admin Dashboard
- **User Management** - View, verify, ban users
- **Listing Moderation** - Approve/reject listings
- **Reports Handling** - Review and resolve reports
- **Geocoding Utility** - Batch geocode existing listings
- **Analytics** - Platform statistics and insights

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Framework**: Tailwind CSS, shadcn/ui
- **Animations**: Framer Motion
- **Backend**: Firebase (Auth, Firestore, Storage)
- **AI**: Google Gemini 2.5 Flash
- **Maps**: Google Maps Geocoding API

## 📋 Prerequisites

- Node.js 18+ and npm
- Firebase account
- Google Cloud account (for Maps & Gemini APIs)

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone <your-repo-url>
cd roombridge
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Copy the example environment file:

```bash
cp .env.example .env
```

### 4. Configure API Keys

Edit `.env` and add your API keys:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Google Maps API Key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Gemini AI API Key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### 5. Get API Keys

#### Firebase Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing
3. Enable Authentication (Email/Password)
4. Create Firestore Database
5. Enable Storage
6. Copy configuration values to `.env`

#### Google Maps API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Geocoding API
3. Create API key
4. Add to `.env` as `VITE_GOOGLE_MAPS_API_KEY`

#### Gemini AI API
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the key
4. Add to `.env` as `VITE_GEMINI_API_KEY`

### 6. Test Gemini API (Recommended)

Before starting, verify your Gemini API key works:

```bash
npm run test:gemini
```

Expected output:
```
✓ API key found
✓ Found 7 available models
✓ gemini-2.5-flash is working!
✅ RECOMMENDED MODEL: gemini-2.5-flash
```

### 7. Start Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 📱 Default Credentials

### Admin Account
- Email: `admin@roombridge.com`
- Password: `Admin@123`

### Test User
Create your own account via the registration page.

## 🎯 Usage Guide

### For Users

1. **Register/Login** - Create account or sign in
2. **Browse Listings** - View available rooms with smart matching
3. **Post Listing** - List your room with photos and details
4. **Post Request** - Create a room request if you're searching
5. **Chat** - Message room owners directly
6. **Verify Profile** - Upload verification documents
7. **Rate Users** - Leave ratings after interactions
8. **AI Assistant** - Click bot icon for help

### For Admins

1. **Login** - Use admin credentials
2. **Manage Users** - View, verify, ban users
3. **Moderate Listings** - Review and approve listings
4. **Handle Reports** - Resolve user reports
5. **Geocode Listings** - Use utility to add coordinates
6. **View Analytics** - Monitor platform statistics

## 🤖 AI Chatbot

The platform includes an AI-powered chatbot assistant:

- **Location**: Floating bot icon (bottom-right corner)
- **Model**: Gemini 2.5 Flash
- **Purpose**: Answer questions about RoomBridge platform
- **Restrictions**: Only answers platform-related questions

### Testing Chatbot

1. Start dev server: `npm run dev`
2. Navigate to any user dashboard page
3. Click the purple bot icon
4. Ask: "What is RoomBridge?"

## 📊 Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run preview         # Preview production build

# Testing
npm run test            # Run unit tests
npm run test:watch      # Run tests in watch mode
npm run test:gemini     # Test Gemini API key

# Linting
npm run lint            # Run ESLint

# Firebase
npm run emulators       # Start Firebase emulators
```

## 🔧 Configuration

### Firestore Security Rules

Located in `firestore.rules`. Key rules:
- Users can only edit their own data
- Admins have full access
- Listings require authentication
- Messages are private between participants

### Storage Rules

Located in `storage.rules`. Key rules:
- Users can upload to their own folders
- Max file size: 5MB
- Allowed types: images only

## 🌐 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Netlify

1. Push code to GitHub
2. Connect repository in Netlify
3. Add environment variables
4. Deploy

### Firebase Hosting

```bash
npm run build
firebase deploy --only hosting
```

## 📁 Project Structure

```
roombridge/
├── src/
│   ├── components/        # Reusable components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── AIChatbot.tsx # AI chatbot widget
│   │   └── ...
│   ├── pages/            # Page components
│   │   ├── admin/        # Admin pages
│   │   ├── user/         # User pages
│   │   └── ...
│   ├── lib/              # Utilities
│   │   ├── firebase/     # Firebase functions
│   │   ├── geocoding.ts  # Maps integration
│   │   └── matchScore.ts # Matching algorithm
│   ├── contexts/         # React contexts
│   └── hooks/            # Custom hooks
├── public/               # Static assets
├── test-gemini-api.js   # API test script
└── ...
```

## 🐛 Troubleshooting

### Chatbot Not Working

1. Verify API key: `npm run test:gemini`
2. Check console for errors
3. Ensure `VITE_GEMINI_API_KEY` is set in `.env`
4. Restart dev server

### Distance Not Showing

1. Enable browser location permission
2. Run geocoding utility (Admin → Geocoding)
3. Check `VITE_GOOGLE_MAPS_API_KEY` is valid

### Firebase Errors

1. Check Firebase configuration in `.env`
2. Verify Firestore rules are deployed
3. Ensure Authentication is enabled
4. Check Storage rules

### Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 📈 Features Roadmap

- [ ] Email notifications
- [ ] SMS verification
- [ ] Payment integration
- [ ] Advanced search filters
- [ ] Mobile app (React Native)
- [ ] Multi-language support

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Support

For issues or questions:
- Open an issue on GitHub
- Contact: support@roombridge.com

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for beautiful components
- [Firebase](https://firebase.google.com/) for backend services
- [Google AI](https://ai.google.dev/) for Gemini API
- [Framer Motion](https://www.framer.com/motion/) for animations

---

**Built with ❤️ for better roommate matching**

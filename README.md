# RoomBridge - Smart Roommate Matching Platform

A modern room rental and roommate matching platform with AI-powered features, smart matching algorithms, and real-time communication.

## ✨ Features

### 🤖 AI-Powered
- **Smart Chatbot** - Gemini 2.5 Flash AI assistant for platform guidance
- **Intelligent Matching** - Compatibility scoring based on location, college, profession, and preferences
- **Smart Feed** - Categorized listings (Emergency, Best Matches, Nearby, Same College, Same Hometown)

### 📍 Location Services
- **Distance Calculation** - Real-time distance to listings
- **Nearby Prioritization** - Boost for listings within 5-10km
- **Auto-Geocoding** - Automatic coordinate generation

### 🏠 Listings
- **Multiple Types** - Long-Term, PG, Short Stay, Emergency, Flatmate
- **Rich Media** - Photos, amenities, preferences
- **Emergency Rooms** - Auto-expire after 3 days

### 💬 Communication
- **Real-time Chat** - Message room owners and seekers
- **Notifications** - Bell alerts for new messages
- **User Profiles** - Ratings and verification status

### 🔒 Safety
- **Verification** - Student ID, Aadhaar/PAN, Live Selfie
- **Auto-Moderation** - Automatic flagging and temporary blocks
- **Reports** - Report inappropriate users
- **Ratings** - Review system

### 👨‍💼 Admin Dashboard
- **User Management** - Verify, ban, manage users
- **Moderation** - Review listings and reports
- **Geocoding Utility** - Batch geocode listings
- **Analytics** - Platform statistics

## 🛠️ Tech Stack

- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Framer Motion
- Firebase (Auth, Firestore, Storage)
- Google Gemini 2.5 Flash AI
- Google Maps Geocoding API

## 🚀 Quick Start

### 1. Install

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your API keys:

```env
# Firebase
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Google Maps
VITE_GOOGLE_MAPS_API_KEY=your_maps_key

# Gemini AI
VITE_GEMINI_API_KEY=your_gemini_key
```

### 3. Get API Keys

**Firebase** - [console.firebase.google.com](https://console.firebase.google.com/)
- Create project
- Enable Auth, Firestore, Storage
- Copy config values

**Google Maps** - [console.cloud.google.com](https://console.cloud.google.com/)
- Enable Geocoding API
- Create API key

**Gemini AI** - [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
- Click "Create API Key"
- Copy key

### 4. Start Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## 🔑 Default Credentials

**Admin**
- Email: `admin@roombridge.com`
- Password: `Admin@123`

## 📱 Usage

### Users
1. Register/Login
2. Browse listings with smart matching
3. Post listings or room requests
4. Chat with users
5. Verify profile
6. Rate users
7. Use AI chatbot (bot icon bottom-right)

### Admins
1. Login with admin credentials
2. Manage users and listings
3. Handle reports
4. Use geocoding utility
5. View analytics

## 📊 Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run test         # Run tests
```

## 🌐 Deployment

### Vercel
1. Push to GitHub
2. Import in Vercel
3. Add environment variables
4. Deploy

### Netlify
1. Connect repository
2. Add environment variables
3. Deploy

### Firebase Hosting
```bash
npm run build
firebase deploy --only hosting
```

## 📁 Project Structure

```
src/
├── components/       # UI components
│   ├── ui/          # shadcn/ui
│   └── AIChatbot.tsx
├── pages/           # Pages
│   ├── admin/       # Admin pages
│   └── user/        # User pages
├── lib/             # Utilities
│   ├── firebase/    # Firebase functions
│   ├── geocoding.ts # Maps integration
│   └── matchScore.ts # Matching algorithm
├── contexts/        # React contexts
└── hooks/           # Custom hooks
```

## 🐛 Troubleshooting

**Chatbot not working**
- Check `VITE_GEMINI_API_KEY` in `.env`
- Verify API key at [aistudio.google.com](https://aistudio.google.com/app/apikey)
- Restart dev server

**Distance not showing**
- Enable browser location permission
- Run Admin → Geocoding Utility
- Check `VITE_GOOGLE_MAPS_API_KEY`

**Firebase errors**
- Verify `.env` configuration
- Check Firestore rules deployed
- Ensure Auth enabled

## 📄 License

MIT License

## 🙏 Credits

- [shadcn/ui](https://ui.shadcn.com/)
- [Firebase](https://firebase.google.com/)
- [Google AI](https://ai.google.dev/)
- [Framer Motion](https://www.framer.com/motion/)

---

Built with ❤️ for better roommate matching

# RoomBridge — Smart Roommate Matching Platform

> AI-powered room rental and roommate matching platform for students and working professionals.

---

## 🔗 Quick Links

| Resource | Link |
|---|---|
| 🌐 **Live Demo** | [roombridge.vercel.app](#) |
| 🎤 **Pitching Video** | [Watch Pitch](#) |
| 🎥 **Demo Video** | [Watch Demo](#) |
| 📊 **Presentation (PPT)** | [View PPT](#) |

> Replace `#` placeholders above with your actual URLs before submission.

---

## 💡 Idea Title

**RoomBridge — Bridging the Gap Between Room Seekers and Room Providers**

---

## 📝 Idea Description

Finding a room or a compatible roommate in a new city is one of the most stressful experiences for students and working professionals. Existing platforms like OLX, NoBroker, and Facebook groups are unstructured, unsafe, and lack intelligent matching — leading to scams, mismatches, and wasted time.

**RoomBridge** is a full-stack web platform that uses AI and smart algorithms to match users with the most compatible rooms and roommates based on their college, profession, location, gender preferences, and hometown. It goes beyond simple search by giving every listing a personalised **match score** out of 100 — so users always see the most relevant options first.

Key differentiators:
- **Bidirectional system** — users can post rooms *or* post what they are looking for
- **Emergency listings** — urgent rooms that auto-expire in 3 days with push notifications
- **Verified identities** — Aadhaar, PAN, Student ID, and live selfie verification
- **AI chatbot** — Gemini 2.5 Flash assistant for instant platform guidance
- **Auto-moderation** — report-based automatic flagging and temporary bans

---

## 🛠️ Technical Details

### Matching Algorithm

The core smart matching engine calculates a compatibility score (0–100) for every listing relative to the logged-in user:

| Factor | Points |
|---|---|
| Same city | 35 |
| Same locality / area | 15 |
| Gender preference match | 20 |
| Same college / profession | 20 |
| Same home district | 10 |
| Proximity bonus (< 5 km) | +5 bonus |

All listings are sorted by descending match score by default. The **Smart Feed** view auto-categorises results into:
- 🚨 Emergency Rooms
- ⭐ Best Matches (≥ 70% score)
- 📍 Nearby Rooms (within 10 km)
- 🎓 Same College Rooms
- 🏡 Same Hometown Rooms

### Location Engine

- Google Maps Geocoding API auto-geocodes every listing/request to lat-long coordinates
- Real-time Haversine distance calculation from the user's browser location
- Admin batch-geocoding utility for bulk processing existing data

### Auto-Moderation Rules

| Reports Received | Action |
|---|---|
| 1 | Account auto-flagged |
| 3+ | Temporary 7-day block |
| Admin ban | All listings permanently removed |

### Emergency Expiration

Emergency listings auto-expire after **72 hours**. A warning notification is sent at the **24-hour** mark. Admins can manually extend or expire listings.

---

## 💻 Technologies Used

### Frontend
- **React 18** + **TypeScript** — component-based UI with strict type safety
- **Vite** — fast build tooling and HMR
- **Tailwind CSS** — utility-first styling
- **shadcn/ui** — accessible, composable UI component library
- **Framer Motion** — animations and page transitions
- **React Router v6** — client-side routing with protected routes

### Backend & Infrastructure
- **Firebase Authentication** — email/password + Google OAuth
- **Cloud Firestore** — real-time NoSQL database
- **Firebase Storage** — image uploads (profile photos, verification docs)
- **Firebase Security Rules** — role-based data access control
- **Firebase Hosting** — static site deployment

### AI / ML
- **Google Gemini 2.5 Flash** — conversational AI chatbot (platform-scoped Q&A)
- **Custom Match Scoring Algorithm** — multi-factor weighted compatibility engine
- **Smart Feed Categorisation** — rule-based personalised feed segmentation

### External APIs
- **Google Maps Geocoding API** — address → coordinates conversion and distance calculation

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (React)                        │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │  Pages /    │  │  Smart Match │  │  Gemini AI Chatbot │  │
│  │  Components │  │  Algorithm   │  │  (Gemini 2.5 Flash)│  │
│  └──────┬──────┘  └──────┬───────┘  └────────┬───────────┘  │
│         │                │                   │               │
│  ┌──────▼────────────────▼───────────────────▼───────────┐  │
│  │               Firebase SDK (Client)                    │  │
│  └──────────────────────┬────────────────────────────────┘  │
└─────────────────────────┼───────────────────────────────────┘
                          │ HTTPS / WebSocket
┌─────────────────────────▼───────────────────────────────────┐
│                     FIREBASE PLATFORM                        │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │    Auth     │  │  Firestore   │  │   Cloud Storage    │  │
│  │  (OAuth +   │  │  (Real-time  │  │  (Photos / Docs)   │  │
│  │  Email/Pass)│  │   NoSQL DB)  │  │                    │  │
│  └─────────────┘  └──────────────┘  └────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                    EXTERNAL SERVICES                         │
│  ┌─────────────────────────────┐  ┌────────────────────┐    │
│  │  Google Maps Geocoding API  │  │  Gemini AI API     │    │
│  └─────────────────────────────┘  └────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

**Data flow:**
1. User actions trigger Firebase SDK calls directly from the browser
2. Firestore real-time listeners push live updates (chat, notifications)
3. Match algorithm runs client-side using pre-fetched user + listing data
4. Gemini API called from client with a platform-scoped system prompt
5. Google Maps Geocoding API called via admin batch-geocoding utility

---

## 🗄️ Database

**Primary Database: Cloud Firestore (NoSQL)**

| Collection | Purpose |
|---|---|
| `users` | Profiles, verification docs, verification status, role |
| `listings` | Room listings with geo-coordinates, amenities, photos |
| `roomRequests` | What users are looking for (reverse listings) |
| `chats` | Real-time message threads between users |
| `notifications` | Bell notifications per user |
| `ratings` | Star ratings and text reviews between users |
| `reports` | User/listing reports with categories |
| `adminActions` | Audit log of admin operations |

All documents are protected by **Firebase Security Rules** enforcing role-based access — regular users can only read/write their own data; admins have elevated read access.

---

## ⭐ Key Features

| Feature | Description |
|---|---|
| 🤖 AI Match Score | Weighted 0–100 compatibility score per listing |
| 🏠 Dual Posting | Post rooms to rent *or* post room-seeking requests |
| 🚨 Emergency Listings | Urgent posts that auto-expire in 3 days |
| 🧠 Smart Feed | Auto-categorised sections (Emergency, Best Match, Nearby, College, Hometown) |
| 💬 Real-time Chat | Firestore-backed instant messaging with full history |
| 🔔 Notifications | Bell alerts for messages, matches, verification, expiry |
| ✅ Identity Verification | Aadhaar, PAN, Student ID, live selfie via device camera |
| ⭐ Ratings & Reviews | 1–5 star rating with text reviews displayed on profiles |
| 🚩 Report & Moderation | Report system + auto-flag/block based on report count |
| 🤖 AI Chatbot | Gemini 2.5 Flash assistant scoped to RoomBridge queries |
| 📍 Distance Badges | Real-time km distance shown on every listing card |
| 👨‍💼 Admin Dashboard | Full user/listing/report/verification management panel |

---

## 📈 Market Impact

### Problem Size
- India has **35 million+** students enrolled in colleges outside their hometowns
- **500,000+** new graduates relocate to metro cities every year for work
- Existing rental platforms (OLX, 99acres, NoBroker) have **no roommate matching intelligence** — users manually scroll hundreds of irrelevant listings

### Solution Impact

| Metric | Current Platforms | RoomBridge |
|---|---|---|
| Match relevance | Random / position-based | AI match score (0–100) |
| Safety | None / self-reported | Document verification + auto-moderation |
| Emergency housing | Not supported | Dedicated emergency listing type |
| Roommate compatibility | Not supported | Multi-factor algorithm |
| Communication | External (WhatsApp/call) | Built-in real-time chat |

### Target Users
- **Students** relocating for college (Tier 1 and Tier 2 cities)
- **Working professionals** moving to new cities for jobs
- **Flat owners / PG owners** seeking reliable, verified tenants

### Business Potential
- **Freemium model** — free for seekers, premium featured listings for landlords
- **Verification as a service** — paid fast-track verification badges
- **B2B** — white-label solution for colleges to manage on-campus/off-campus housing
- Addressable market: **$2B+** in India's online rental discovery space

---

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

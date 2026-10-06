# Fast Connect — Enterprise Telephony & Dual-SIM Call Center Platform

Fast Connect is a modern, high-resilience enterprise call center and site-operations management platform built for multi-branch organizations, banking maintenance operations, and vendor coordination hubs. It combines **WebRTC PBX Softphone calling**, **Dual-SIM cellular dispatching**, **ticketing & vendor dispatch**, and **real-time persistent synchronization**.

---

## 🌟 Key Features

### 1. 📱 Dedicated SIM Calling Station & Working Form
- **Dual-SIM Cellular Control**: Support for corporate multi-SIM devices (SIM 1: Jazz Corporate 4G, SIM 2: Zong Enterprise 4G) with live carrier and signal status.
- **Interactive Calling Form**:
  - Country code selection (`+92`, `+1`, `+44`, `+971`, etc.) with real-time phone number formatting.
  - Direct quick-fill selectors for Pakistani bank branches (HBL, MCB, Meezan, Allied Bank, UBL) and emergency contractors.
  - Optional linkage directly to open complaint/service tickets.
  - Pre-call intent and purpose documentation.
- **Native Dialer & In-App Tracking**:
  - One-click native cellular phone dialer launcher (`tel:` URI scheme).
  - In-app live cellular session tracker with active talk timer, live discussion note-taking, and call outcome selector (`Answered`, `Busy`, `Voicemail`, `Follow-up Required`, `Resolved`).
  - Auto-logging to the persistent call ledger and linked ticket audit trail.
- **Quick Manual Logger**: Log past cellular and offline phone calls directly into the system.

### 2. 📞 WebRTC SIP PBX Softphone Console
- Full-featured browser softphone built on top of **SIP.js** and WebRTC.
- Realistic telephony sound engine powered by the **Web Audio API**:
  - Dual-tone multi-frequency (DTMF) dialpad sounds.
  - Realistic UK/US call progress ringing tones.
  - Interactive hold music synthesizer.
  - Distinct call-connected chime and remote disconnect tones.
- Multi-extension PBX directory with status indicators (Online, Busy, Away, Offline).
- Smart call forwarding matrix with immediate, no-answer, and busy forwarding rules.

### 3. 💾 Resilient Persistent Data Architecture (`liveStore`)
- **Zero Data Loss**: Eliminates blank screen issues caused by cold starts or unreachable remote database endpoints.
- **Multi-Tab Synchronization**: Uses the browser's `BroadcastChannel` API (`fastconnect_data_sync`) to keep multiple open agent tabs instantly synchronized.
- **Hybrid Cloud Sync**: Automatically backs up records to Firebase Firestore when available, with intelligent timeouts to prevent UI stalling.
- **Backup & Restore**: Built-in JSON export/import and one-click database reset for admin users.

### 4. 🎫 Service Request & Complaint Ticketing
- End-to-end ticketing lifecycle (`New` → `In Progress` → `Vendor Assigned` → `Resolved` → `Closed`).
- Vendor dispatch system: assign licensed contractors (Electricians, HVAC, Plumbing, Security).
- Contractor response tracking: log technician names, arrival ETAs, repair notes, and cost quotations.
- Complete chronological audit timeline on every ticket.

### 5. 🤖 AI-Powered Call Summaries & Insights
- Integrated with Google Gemini to automatically transcribe, extract sentiment, and summarize telephony discussions into concise bullet points and actionable next steps.

### 6. 📊 Analytics, Activity Tracking & Administration
- Daily work reporting system for field agents and review portal for supervisors.
- Agent performance metrics: average call duration, resolution rates, and hourly call volume.
- Administration control center for employee extensions, call records, and vendor master data.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4, Framer Motion, Lucide Icons
- **Telephony & Audio**: SIP.js, WebRTC, Web Audio API Synthesizer
- **State & Persistence**: LocalStorage with BroadcastChannel sync + Firebase Firestore
- **AI Engine**: Google Gemini API (`@google/genai`)
- **Deployment**: Vercel ready (includes `vercel.json` SPA configuration)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### 1. Clone the Repository
```bash
git clone https://github.com/Ainey123/calling-app-for-company.git
cd calling-app-for-company
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env.local` file in the root directory (or copy from `.env.example`):
```env
# Optional: Google Gemini API key for AI summaries
GEMINI_API_KEY="your-gemini-api-key"
```

### 4. Run Development Server
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173` (or the port indicated in your terminal).

### 5. Build for Production
```bash
npm run build
```
The compiled production bundle will be generated in the `dist/` directory.

---

## ☁️ Deploying to Vercel

This repository includes a pre-configured `vercel.json` optimized for Single Page Application (SPA) routing on Vercel.

### Option A: 1-Click Deployment via Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com) and log in.
2. Click **"Add New..."** -> **"Project"**.
3. Import the GitHub repository: `Ainey123/calling-app-for-company`.
4. Configure the project settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. *(Optional)* Add your `GEMINI_API_KEY` under **Environment Variables**.
6. Click **Deploy**.

### Option B: Deploy via Vercel CLI

```bash
# Log in to Vercel
npx vercel login

# Deploy preview
npx vercel

# Deploy directly to production
npx vercel --prod
```

---

## 📂 Project Structure

```
├── dist/                      # Production build output
├── src/
│   ├── components/            # UI Views & Components
│   │   ├── SimCallingView.tsx # Dual-SIM cellular calling station & form
│   │   ├── SoftphoneModal.tsx # WebRTC PBX softphone dialer
│   │   ├── CallsView.tsx      # Call ledger & historical logs
│   │   ├── TicketsView.tsx    # Complaint tickets & vendor dispatch
│   │   ├── TopNav.tsx         # Navigation bar & sound controls
│   │   ├── Sidebar.tsx        # Application menu navigation
│   │   └── ...
│   ├── services/
│   │   ├── liveStore.ts       # Unified resilient multi-tab persistent store
│   │   └── sipManager.ts      # SIP / WebRTC telephony gateway
│   ├── utils/
│   │   └── audio.ts           # Web Audio API ringtone & hold synthesizer
│   ├── types.ts               # TypeScript data models & definitions
│   ├── firebase.ts            # Firestore integration with timeout fallbacks
│   ├── App.tsx                # Core application container & state orchestration
│   └── main.tsx               # Entry point
├── vercel.json                # Vercel SPA routing & build configuration
├── vite.config.ts             # Vite configuration with Tailwind CSS plugin
├── package.json               # Dependencies and scripts
└── README.md                  # Project documentation
```

---

## 📄 License

This project is licensed for internal company operations and commercial use.

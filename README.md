# CodeSapiens Networking Bingo 🎮🚀

An interactive, premium, full-stack Networking Bingo web application designed for the **CodeSapiens Alumni Meetup**. This application gamifies professional networking by allowing attendees to create a developer profile, scan each other's custom QR codes, unlock matching Bingo squares, and climb the live event leaderboard.

---

## ✨ Features

- **🎯 Interactive Bingo Board**: A custom 5x5 grid of developer achievements, tech stacks, and career milestones (e.g., "Passionate about Rust", "Wrote a 500-line function with zero comments").
- **📸 Secure QR Code Scanning**: Integrated, real-time webcam and camera scanning to verify connection matches with other attendees.
- **🏆 Live Leaderboard**: A dynamic leaderboard calculating scores based on successful scans, connection counts, and completed Bingo rows (Horizontal, Vertical, Diagonal).
- **🎭 Custom Tamil Developer Meme Popups**: Every successful connection rewards you with a unique, culturally rich, high-fidelity developer meme (integrated with Giphy) customized to the scanned user's profile.
- **🥇 Badges & Achievements**: Unlock unique digital badges like "Icebreaker" (first connection), "Column Conqueror" (complete a vertical line), and "Bingo Grandmaster" (complete the entire board).
- **👤 Dynamic Attendee Profiles**: Custom avatar builder, Pass-out Cohort tracking, role/company settings, and quick-access social links (LinkedIn, GitHub).

---

## 🛠️ Technology Stack

- **Frontend**: [React 19](https://react.dev/) + [Vite](https://vite.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) for fluid, modern utility classes and layouts
- **Animations**: [Motion](https://motion.dev/) for smooth state transitions, micro-interactions, and modal popups
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL database, Row-Level Security (RLS) policies, and simple Auth schemas)
- **Scanning Engine**: [jsQR](https://github.com/cozmo/jsQR) for robust, client-side camera QR code decoding

---

## 🚀 Getting Started

### 1. Prerequisites

Make sure you have [Node.js](https://nodejs.org/) (v18 or higher) and [npm](https://www.npmjs.com/) installed on your system.

### 2. Clone and Install Dependencies

```bash
# Install package dependencies
npm install
```

### 3. Setup Your Environment Variables

Create a `.env` file in the root directory (you can copy the structure from `.env.example`):

```bash
cp .env.example .env
```

Open `.env` and fill in your Supabase project credentials:

```env
# Google Gemini API Key (Optional, used for AI-generated text/captions)
GEMINI_API_KEY="your_gemini_api_key"

# App URL for absolute link resolution
APP_URL="http://localhost:3000"

# Supabase Project Credentials
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
```

### 4. Database Setup

To provision the required Postgres tables, views, and security rules, execute the schema definitions found in `supabase-schema.sql` directly inside your Supabase project's **SQL Editor**:

1. Log into your **Supabase Dashboard**.
2. Select your project and navigate to the **SQL Editor** tab on the left sidebar.
3. Paste the contents of `supabase-schema.sql` and click **Run**.
4. This will create:
   - `profiles` table to store attendee details.
   - `boards` table to keep track of Bingo grid completions.
   - `scores` table to maintain live networking points.
   - PostgreSQL triggers to automatically synchronize points and boards.

### 5. Running the Application

To start the local development server:

```bash
npm run dev
```

The application will run locally on **http://localhost:3000**.

### 6. Build for Production

To compile and bundle the static files for production deployment:

```bash
npm run build
```

This generates highly optimized production assets in the `dist/` directory, which can be deployed to static hosting providers (Netlify, Vercel, Cloudflare Pages, etc.).

---

## 🔒 Security

All database tables are guarded using Postgres **Row-Level Security (RLS)**. Attendees can only read public profiles and modify their own personal boards/scores, ensuring a secure and reliable experience for all event participants.

# 🎓 EduEthiopia AI — Grade 1–12 AI Study & Exam Prep Platform

[![Node.js](https://img.shields.io/badge/Node.js-18%2B%20%7C%2020%2B-brightgreen)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8)](https://tailwindcss.com/)
[![Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini%20Flash-orange)](https://aistudio.google.com/)
[![License](https://img.shields.io/badge/License-Commercial%20Ready-purple)](#)

A full-stack, AI-powered study and exam prep platform built specifically for Ethiopian students (Grades 1–12) and educators. Students can upload study materials, PDFs, photos, class notes, or YouTube video links to instantly generate structured **AI Study Notes**, **Multiple-Choice / True-False Quizzes**, and **Interactive 3D Flashcards** in both **English** and **Amharic (አማርኛ)**.

Includes a built-in **Telebirr Payment Flow** with 6-digit verification codes and receipt uploads, and a protected **Owner Admin Portal** for payment approval and user tier management.

---

## 📖 Table of Contents
1. [What the Platform Is](#-what-the-platform-is)
2. [Key Features](#-key-features)
3. [System Requirements](#-system-requirements)
4. [Installation & Local Setup](#-installation--local-setup)
5. [Environment Variables (.env)](#-environment-variables-env)
6. [Supabase Setup Guide](#-supabase-setup-guide)
7. [Firebase / Firestore Setup Guide](#-firebase--firestore-setup-guide)
8. [Deployment Guide](#-deployment-guide)
   - [Render.com (Recommended)](#1-deploy-to-rendercom)
   - [Vercel](#2-deploy-to-vercel)
   - [Railway](#3-deploy-to-railway)
   - [Docker / Self-Hosted VPS](#4-docker--vps-deployment)
9. [Admin Portal & Monetization](#-admin-portal--monetization)
10. [Project Structure](#-project-structure)
11. [License & Support](#-license--support)

---

## 🌟 What the Platform Is

**EduEthiopia AI** bridges educational access across Ethiopia by turning raw study content into structured study tools. Whether preparing for Grade 8 Regional Exams, Grade 12 National University Entrance Exams (ESUEE), or daily classroom tests, students can study smarter with:

- **AI Study Notes**: Automatically organizes messy texts or YouTube transcripts into clean, numbered topic units with key summaries and bullet points.
- **AI Quiz Engine**: Generates curriculum-aligned exams with instant scoring, feedback, and explanations.
- **3D Flashcard Deck**: Flip cards with front prompts, back answers, and memory hints.
- **Concept Explainer ("Explain Like I'm 5")**: Simplifies complex science, mathematics, and social studies concepts with real-world analogies.
- **Bilingual Amharic & English Support**: Full UI and AI generation in Amharic (አማርኛ) and English.
- **Audio Voice Synthesis (TTS)**: Reads notes and flashcards aloud for auditory learning.
- **Ethiopian Calendar Integration**: Native support for Ethiopian birthdates (Meskerem–Pagume) and local academic calendars.
- **Telebirr Monetization**: Automated 6-digit remark codes, screenshot receipt uploads, and an owner review queue.

---

## ✨ Key Features

### 🧠 AI Generation Engines (Powered by Google Gemini)
- **Multi-Source Ingestion**: Paste notes, upload text files/PDF extracts, or enter YouTube video links.
- **Automatic YouTube Transcript Extraction**: Analyzes spoken video captions to generate study materials directly from Ethiopian educational YouTube channels.
- **Strict Curriculum Grounding**: Prevents hallucination by strictly grounding notes, questions, and flashcards in the provided source material.
- **Zero-Emoji Clean Content**: Generates professional academic content formatted in clean Markdown.

### 📚 Study Tools & Student Experience
- **Interactive Quiz Modes**: Multiple Choice (4 choices) or True/False with timer and score breakdown.
- **Interactive Flashcards**: 3D flip animation with keyboard navigation (`Space`, `ArrowLeft`, `ArrowRight`).
- **Explain Concept Module**: Single-click simplification with interactive check questions.
- **Offline-Ready Client Storage**: Stores student profile and past study history locally with instant cloud synchronization.
- **Native iOS & Android Mobile Frame**: Responsive design styled with an iOS status bar, bottom navigation tabs, and dark mode.

### 💰 Monetization & Admin Management
- **Telebirr Payment Flow**: Generates a unique 6-digit transaction code for each payment attempt.
- **Receipt Screenshot Upload**: Students upload a receipt screenshot directly within the app.
- **Owner Admin Portal**:
  - Review pending payment receipts with zoomable image viewer.
  - Approve or reject transactions in one click.
  - Manually grant PRO status to any student by ID.
  - Real-time search, filter by status, and live revenue analytics.
- **Automated Email/SMS Webhook Integration**: Webhook endpoints ready for SMS forwarders or automated payment bots.

---

## 💻 System Requirements

Before running the application, make sure you have:

- **Node.js**: Version `18.x`, `20.x`, or higher
- **Package Manager**: `npm` (v9+) or `yarn` / `pnpm`
- **Google Gemini API Key**: Free or paid key from [Google AI Studio](https://aistudio.google.com/)
- **Database (Optional)**: Firebase Firestore (included) OR Supabase PostgreSQL (setup guide below)
- **Modern Web Browser**: Chrome, Edge, Safari, or Firefox

---

## 🚀 Installation & Local Setup

Follow these steps to run the application on your computer:

### 1. Extract / Clone the Project
```bash
git clone https://github.com/YOUR_USERNAME/eduethiopia-ai.git
cd eduethiopia-ai
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Create Your Environment Configuration (`.env`)
Copy the provided `.env.example` file to `.env`:

```bash
cp .env.example .env
```

Open `.env` in your text editor and add your API key and preferences:
```env
GEMINI_API_KEY="AIzaSyYourGeminiApiKeyHere"
VITE_ADMIN_EMAIL="admin@yourdomain.com"
VITE_ADMIN_PASSWORD="YourStrongAdminPassword123"
VITE_TELEBIRR_PHONE="0912345678"
VITE_PRO_PRICE_ETB="500"
```

### 4. Start Development Server
```bash
npm run dev
```
Open your browser and navigate to: `http://localhost:3000`

### 5. Build for Production
```bash
npm run build
npm start
```

---

## 🔑 Environment Variables (.env)

All sensitive keys, passwords, and numbers are managed through environment variables:

| Variable | Required | Default Value | Description |
| :--- | :---: | :--- | :--- |
| `GEMINI_API_KEY` | **Yes** | `""` | Google Gemini AI API key from [Google AI Studio](https://aistudio.google.com/) |
| `PORT` | No | `3000` | Port for the Express backend and HTTP server |
| `APP_URL` | No | `http://localhost:3000` | Full URL where the app is hosted |
| `VITE_ADMIN_EMAIL` | No | `admin@eduethiopia.et` | Email used to log into the Owner Admin Portal |
| `VITE_ADMIN_PASSWORD` | No | `admin123456` | Password used to unlock the Owner Admin Portal |
| `ADMIN_EMAIL` | No | `admin@eduethiopia.et` | Server-side notification email for upgrade dispatches |
| `VITE_TELEBIRR_PHONE` | No | `0912345678` | Telebirr phone number shown to users for manual transfer |
| `VITE_TELEBIRR_NAME` | No | `EduEthiopia Store` | Merchant / Receiver name shown in Telebirr payment modal |
| `VITE_PRO_PRICE_ETB` | No | `500` | Monthly PRO subscription price in Ethiopian Birr (ETB) |
| `VITE_SUPPORT_EMAIL` | No | `support@eduethiopia.et` | Customer support email displayed on the profile screen |

---

## 🗄️ Supabase Setup Guide

If you prefer using **Supabase** (PostgreSQL) instead of Firebase Firestore, follow this step-by-step setup guide:

### 1. Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a free account.
2. Click **New Project**, choose your project name and database password, and select a region close to your users (e.g., Central Europe / Frankfurt).

### 2. Run Database SQL Schema
Open the **SQL Editor** in your Supabase Dashboard and run the following script:

```sql
-- 1. Users Profile Table
CREATE TABLE public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  auth_method TEXT DEFAULT 'email',
  ethiopian_birthday JSONB,
  language TEXT DEFAULT 'en',
  grade INTEGER DEFAULT 11,
  is_pro BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Study History Table (Notes, Quizzes, Flashcards)
CREATE TABLE public.study_history (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('notes', 'quiz', 'flashcard')),
  data JSONB NOT NULL,
  date TEXT NOT NULL,
  grade INTEGER DEFAULT 11,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Telebirr Payment Requests Table
CREATE TABLE public.payment_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT,
  user_phone TEXT,
  user_email TEXT,
  amount NUMERIC DEFAULT 500,
  currency TEXT DEFAULT 'ETB',
  telebirr_ref TEXT,
  six_digit_code TEXT NOT NULL,
  receipt_image_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

-- 5. Public / Authenticated Access Policies
CREATE POLICY "Public read/write users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public read/write study_history" ON public.study_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public read/write payment_requests" ON public.payment_requests FOR ALL USING (true) WITH CHECK (true);
```

### 3. Add Supabase Client Configuration
Install the Supabase client:
```bash
npm install @supabase/supabase-js
```

Add your Supabase URL and Anon Key to `.env`:
```env
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
```

---

## 🔥 Firebase / Firestore Setup Guide

The application comes pre-configured with **Firebase Firestore**.

### 1. Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Create a new project named `eduethiopia-app`.
3. Enable **Cloud Firestore** in Production or Test mode.
4. Enable **Firebase Authentication** (Email/Password and Anonymous).

### 2. Firestore Security Rules
Deploy the included `firestore.rules` file:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profile documents
    match /users/{userId} {
      allow read, write: if true;
    }
    
    // User study history
    match /history/{historyId} {
      allow read, write: if true;
    }
    
    // Telebirr payment verification queue
    match /payment_requests/{requestId} {
      allow read, write: if true;
    }
  }
}
```

---

## 🚢 Deployment Guide

### 1. Deploy to Render.com (Recommended)
Render is the easiest platform for full-stack Node.js Express + React applications.

1. Push your repository to **GitHub**.
2. Log into [Render.com](https://render.com) and click **New +** -> **Web Service**.
3. Select your GitHub repository.
4. Set the configuration:
   - **Environment**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
5. In **Environment Variables**, add:
   - `GEMINI_API_KEY`: *Your Google Gemini API Key*
   - `VITE_ADMIN_EMAIL`: `admin@yourdomain.com`
   - `VITE_ADMIN_PASSWORD`: `yourAdminPassword123`
   - `VITE_TELEBIRR_PHONE`: `0912345678`
   - `VITE_PRO_PRICE_ETB`: `500`
6. Click **Create Web Service**. Your app will be live within 2 minutes!

---

### 2. Deploy to Vercel
1. Install the Vercel CLI: `npm i -g vercel`
2. Run `vercel` in your project folder.
3. In the Vercel Project Settings, add `GEMINI_API_KEY` under **Environment Variables**.
4. Configure the build command as `npm run build` and output directory as `dist`.

---

### 3. Deploy to Railway
1. Go to [railway.app](https://railway.app) and create a new project from GitHub.
2. Railway automatically detects `package.json` and runs `npm run build` & `npm start`.
3. Add `GEMINI_API_KEY`, `VITE_ADMIN_EMAIL`, and `VITE_ADMIN_PASSWORD` in the **Variables** tab.

---

### 4. Docker / VPS Deployment
You can run this app on any Ubuntu/Debian VPS using Docker:

#### `Dockerfile`
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/server.cjs"]
```

#### Build & Run Container:
```bash
docker build -t eduethiopia-ai .
docker run -d -p 3000:3000 --env-file .env --name eduethiopia-app eduethiopia-ai
```

---

## 🛡️ Admin Portal & Monetization

### How to Access the Admin Portal
1. Open the app and navigate to the **Profile** tab (bottom right).
2. Click **"Owner Admin"** or **"Admin Login"**.
3. Enter your configured admin credentials (from `VITE_ADMIN_EMAIL` and `VITE_ADMIN_PASSWORD`).
4. Click **Log In** to enter the **EduEthiopia Admin Portal**.

### Admin Dashboard Features:
- **Pending Review Queue**: View all incoming Telebirr receipts with student name, phone, transaction ID, and 6-digit remark code.
- **One-Click Approve / Reject**: Approving a payment automatically grants the student permanent **PRO** access in the database.
- **Manual Grant**: Search any student by their User ID and grant PRO status immediately.
- **Receipt Image Modal**: Click "View Receipt" to inspect the high-resolution Telebirr payment screenshot.
- **Revenue Analytics**: Track total active subscribers and generated ETB revenue in real time.

---

## 📁 Project Structure

```text
├── .env.example               # Environment variables template
├── README.md                  # Complete product documentation
├── package.json               # Node.js dependencies & scripts
├── server.ts                  # Express backend & Gemini API proxy
├── vite.config.ts             # Vite configuration
├── firestore.rules            # Firestore security rules
├── src/
│   ├── main.tsx               # Client React entry point
│   ├── App.tsx                # Main App controller & navigation
│   ├── config.ts              # Centralized environment configuration
│   ├── types.ts               # Shared TypeScript data models & interfaces
│   ├── components/
│   │   ├── HomeScreen.tsx     # Study material input, PDF/image upload, notes view
│   │   ├── QuizModal.tsx      # Interactive Multiple Choice & True/False quiz
│   │   ├── FlashcardModal.tsx # 3D Flip flashcards deck & review controls
│   │   ├── ExplainConceptModal.tsx # Simplified ELI5 concept explainer
│   │   ├── HistoryScreen.tsx  # Past generated notes, quizzes & flashcard decks
│   │   ├── ProfileScreen.tsx  # User profile, Telebirr payment modal & admin trigger
│   │   ├── AdminPanelScreen.tsx # Complete Owner Admin Portal & review queue
│   │   ├── AuthScreen.tsx     # Registration & sign-in modal
│   │   └── IOSWrapper.tsx     # iOS/Android frame container & navigation
│   ├── lib/
│   │   ├── db.ts              # Database abstraction layer (Firestore & LocalStorage)
│   │   └── firebase.ts        # Firebase client SDK initialization
│   └── utils/
│       ├── ethiopianCalendar.ts # Ethiopian date conversion (Meskerem–Pagume)
│       └── tts.ts             # Text-to-speech voice synthesis utility
```

---

## 📄 License & Support

- **Commercial Use**: This source code package is licensed for commercial use and resale on software marketplaces like **SellMyCode** and **CodeCanyon**.
- **Customer Support**: For questions or customizations, contact your support email or open an issue on your repository.

---

⭐ *Built with pride for Ethiopian students & educators.*

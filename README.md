# QueueLess Government Office

QueueLess is an advanced, AI-powered digital queue management system designed for government offices and public service organizations. It eliminates physical waiting lines, improves service efficiency, and provides citizens with real-time updates and ML-driven wait time predictions.

## 🚀 Features

- **For Citizens:**
  - Find nearby government offices and services.
  - Generate digital tokens remotely (No standing in lines).
  - Real-time live queue tracking via WebSockets.
  - **AI-Powered Wait Time Predictions** based on real-time data and historical trends.
  - Feedback and history tracking.

- **For Staff & Counters:**
  - Dedicated Counter Dashboard.
  - One-click token calling (triggers realtime updates to citizens).
  - Mark services as Completed or No-Show.

- **For Admins & Super Admins:**
  - Analytics and Reporting (Peak hours, service times, performance).
  - Manage Offices, Services, and Staff accounts.
  - **AI Analytics Portal** for monitoring ML model confidence, trends, and accuracy.

## 🏗 Architecture

- **Frontend:** Next.js 16 (App Router), React, TailwindCSS, Lucide Icons, Recharts
- **Backend:** Node.js (Next.js API Routes) + Socket.io for Real-time events
- **Database:** MongoDB (Mongoose)
- **AI Microservice:** Python 3, FastAPI, Scikit-Learn (Random Forest Regressor)

## 🛠 Getting Started

### 1. Web Application (Next.js)

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```
2. Setup your `.env.local` with your `MONGODB_URI` and `JWT_SECRET`.
3. Seed the database with initial Super Admin and test data:
   ```bash
   npm run seed
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

### 2. AI Engine (Python FastAPI)

1. Navigate to the `ai-engine` directory.
2. Run the automated setup script for Windows:
   ```bash
   setup.bat
   ```
   *(Or manually create a venv, install `requirements.txt`, and run `uvicorn main:app --reload`)*
3. The AI engine will start on `http://localhost:8000`.

## 🧪 Testing

To run the End-to-End integration test simulating a full Citizen -> AI -> Staff workflow:
```bash
npx tsx scripts/test_e2e.ts
```

## 📜 Status
- **Phase 1-3:** Citizen, Staff, Admin Portals (Stable)
- **Phase 4-6:** AI Infrastructure & ML Prediction Models (Stable)
- **Phase 7-8:** E2E Testing & Production Build (Passed)

**Production Ready ✅**

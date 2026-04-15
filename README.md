# 🚨 ClearPath AI

**Safe routes for every commuter**

---

## 📌 Problem Statement

Urban commuters—especially cyclists, pedestrians, wheelchair users, and e-scooter riders—face daily risks that traditional navigation apps fail to address.

Current GPS systems like Google Maps focus on **distance and time**, but ignore **micro-hazards** such as:

* Blocked bike lanes 🚧
* Parked vehicles in pedestrian paths 🚐
* Potholes and damaged roads 🕳
* Temporary construction zones 🏗

These hazards create **unsafe and inaccessible routes**, particularly for vulnerable users.

---

## 💡 Our Solution

**ClearPath AI** is a real-time, community-driven hazard alert system designed to make urban commuting safer.

It combines:

* 📍 Location-based hazard detection
* 👥 Peer-to-peer reporting
* ⚡ Real-time alerts via WebSockets
* 🧠 AI-assisted detection (mock/extendable)

👉 The system warns nearby users about hazards within a **defined radius (e.g., 50m)** and suggests safer actions.

---

## 🚀 Key Features

### 🗺️ Live Dashboard

* Displays nearby hazards in real time
* Shows severity and distance
* Updates dynamically based on location

### ⚠️ Hazard Reporting

* Report hazards in seconds
* Categorize by type and severity
* Instantly notify nearby users

### 🔔 Real-Time Alerts

* WebSocket-based instant alerts
* Critical hazard popups
* Audio-first support (for accessibility)

### 👤 Smart Onboarding

* Choose commuter type:

  * Cyclist 🚴
  * Pedestrian 🚶
  * Wheelchair ♿
  * E-scooter 🛴
* Personalizes alerts and UI

### 🤖 AI Detection (Mock/Extendable)

* Simulated hazard detection (YOLO-ready pipeline)
* Can integrate with real AI models later

### ♿ Accessibility First

* High contrast mode
* Large touch targets
* Audio alert support

---

## 🏗️ Tech Stack

### Frontend

* React / Vite
* Tailwind CSS
* Responsive UI (Stitch-based design)

### Backend

* Node.js + TypeScript
* Express.js
* WebSocket (real-time alerts)

### Database

* In-memory store (development)
* Firebase Firestore (optional production)

---

## 🔌 Architecture

Frontend (UI)
↓
REST APIs (Express)
↓
Geo + Hazard Logic
↓
WebSocket Alerts
↓
Users receive real-time notifications

---

## ⚙️ How to Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/abPragathi007/Clearpath_AI_Promptwar.git
cd Clearpath_AI_Promptwar
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run backend server

```bash
npm run dev
```

### 4. Open in browser

```
http://localhost:5173
```

If port is busy:

```bash
$env:PORT='3100'
npm run dev
```

---

## 🌐 GitHub Deployment Notes

This repository now includes a GitHub Pages workflow at `.github/workflows/deploy-pages.yml`.

Important:

* GitHub Pages deploys the frontend only (static files)
* Backend APIs (`/api/...`) must be deployed separately (Render, Railway, Fly.io, etc.)

If backend is not deployed, the app still runs in demo/offline mode with fallback data.

### Configure backend for deployed frontend

1. Deploy backend server and copy its public URL
2. In GitHub repository settings, add a repository variable:

  * `VITE_API_BASE_URL=https://your-backend-domain.com`

3. Re-run the `Deploy GitHub Pages` workflow

---

## 🔑 API Endpoints

| Method | Endpoint        | Description          |
| ------ | --------------- | -------------------- |
| POST   | /api/v1/users   | Create user          |
| POST   | /api/v1/hazards | Report hazard        |
| GET    | /api/v1/hazards | Fetch nearby hazards |
| GET    | /api/v1/alerts  | Get active alerts    |

---

## 📡 Real-Time System

* WebSocket connection enables:

  * Instant hazard alerts
  * Live updates
  * Event-based communication

---

## 🧪 Demo Flow

1. Select commuter profile
2. View dashboard
3. Report a hazard
4. Nearby users receive alert instantly

---

## 🌍 Future Improvements

* 🗺️ Mapbox / Google Maps integration
* 🤖 Real AI detection (YOLOv8, Vision API)
* 📱 Mobile app (React Native)
* 🌐 Deployment (Vercel / Render)
* 📊 Analytics dashboard

---

## 🤝 Contributors

* Pragathi
* Team ClearPath AI

---

## 📜 License

This project is open-source and available under the MIT License.

---

## ❤️ Vision

> Making cities safer, one route at a time.

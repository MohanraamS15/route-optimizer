# 🚚 Route Optimizer — VRP & Trip Planning Platform

A modern, full-stack Vehicle Routing Problem (VRP) & Trip Planning web application built with **React**, **Node.js (Express & Prisma)**, and **Python (FastAPI & Google OR-Tools)**.

---

## 🌟 Features

- **Dual Routing Modes**:
  - 🗺️ **Trip Planner**: Single-vehicle multi-stop itinerary optimizer for road trips and sales tours.
  - 🚛 **Delivery (CVRP)**: Multi-vehicle fleet distribution system with package demand and capacity constraints per vehicle.
- **12-Hour AM/PM Time Windows**: Input time windows naturally (e.g. `9:00 AM – 5:00 PM`) with native clock pickers and automated seconds conversion.
- **Resilient Multi-Engine Geocoding**: Dual-tier location lookup using OpenStreetMap Nominatim with India country bias and instant Photon OSM fallback.
- **Interactive Fullscreen Leaflet Maps**: View multi-stop routes with color-coded vehicle polylines, start/end markers, distance badges, and a 1-click fullscreen overlay.
- **Smart Constraint Warnings & Disclaimers**: Automatic detection and transparent disclaimers for unachievable time window targets across distant locations.
- **Responsive Modern UI**: Custom CSS design system with distinct status badges (`Draft`, `Processing`, `Completed`), toast notifications, and mobile-to-laptop responsive grid layouts.

---

## 🏗️ Architecture

```
┌───────────────────────────┐      HTTP / JSON      ┌───────────────────────────┐
│     React 18 Frontend     │ ────────────────────> │   Node.js Express Backend │
│  (Vite + React-Leaflet)   │                       │   (Prisma ORM + PostgreSQL)│
└───────────────────────────┘                       └─────────────┬─────────────┘
                                                                  │
                                                        HTTP POST │ Payload
                                                                  ▼
                                                    ┌───────────────────────────┐
                                                    │   Python FastAPI Engine   │
                                                    │   (Google OR-Tools + OSRM)│
                                                    └───────────────────────────┘
```

---

## 🚀 Quick Start Guide

---

## 🌐 Deployment Environment Variables Checklist (`.env`)

When deploying your project to production cloud hosts (Vercel, Render, AWS, Docker), set these variables in your backend environment settings:

```env
# Database Connection URL (PostgreSQL)
DATABASE_URL="postgresql://user:password@your-db-host:5432/dbname"

# Secret Key for JWT Authentication
JWT_SECRET="YourSuperSecretJWTKey"

# React Frontend Production URL (For CORS Security)
CLIENT_URL="https://your-frontend-domain.vercel.app"

# Python FastAPI Optimization Engine Production URL
FASTAPI_URL="https://your-python-engine-domain.onrender.com"

# Server Port (Default: 3000)
PORT=3000
```

---


### 1. Backend Setup (Node.js Express)

```bash
cd backend
npm install
npx prisma db push
npm run dev
```
> Running on `http://localhost:3000`  
> Swagger Documentation: `http://localhost:3000/api-docs`  
> Health Check: `http://localhost:3000/health`

---



### 2. Optimization Engine Setup (Python FastAPI)

```bash
cd optimization-service
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app:app --port 8000 --reload
```
> Running on `http://localhost:8000`

---

### 3. Frontend Setup (React Vite)

```bash
cd frontend
npm install
npm run dev
```
> Running on `http://localhost:5173`

---

## 📑 Key API Endpoints

### 🔑 Authentication (`/auth`)
- `POST /auth/register` — Register a new account.
- `POST /auth/login` — Authenticate and receive a JWT token.

### 📍 Optimization Jobs (`/optimization`)
- `GET /optimization` — List user jobs.
- `POST /optimization` — Create new job (`TRIP_PLANNER` or `DELIVERY`).
- `GET /optimization/:id` — Get job details and vehicles.
- `PATCH /optimization/:id` — Set Start & End locations (`startIndex`, `endIndex`).
- `POST /optimization/:id/locations` — Add location(s) with optional `demand` and `timeWindowStart`/`timeWindowEnd`.
- `POST /optimization/:id/optimize` — Run Google OR-Tools optimization.
- `GET /optimization/:id/result` — Retrieve calculated routes, distances, durations, and disclaimers.

### 🩺 System Health (`/health`)
- `GET /health` — Check backend service health status.

---



## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, React-Leaflet, Lucide Icons, Vanilla CSS
- **Backend API**: Express.js, Prisma ORM, Zod Validation, JWT Auth, Helmet, Rate Limit
- **Optimization Engine**: FastAPI, Google OR-Tools, OSRM (Open Source Routing Machine), Photon Geocoder

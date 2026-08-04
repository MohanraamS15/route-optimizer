# 🚚 Route Optimizer — VRP & Itinerary Planning Platform

A full-stack, microservices-based application that solves complex Vehicle Routing Problems (VRP) and Traveling Salesperson Problems (TSP). It calculates the most efficient delivery routes and trip itineraries across multiple locations and vehicle fleets using real-world road networks, capacity bounds, and time windows.

---

## 🔗 Live Demo & Deployment

- 🌐 **Frontend (Vercel)**: [https://route-optimizer-ebon.vercel.app](https://route-optimizer-ebon.vercel.app)
- ⚙️ **Backend API (Render)**: [https://route-optimizer-backend-6ehr.onrender.com](https://route-optimizer-backend-6ehr.onrender.com)
- 🧮 **Python Engine (Render)**: `https://route-optimizer-python.onrender.com`
- 🗄️ **Database**: Neon Serverless PostgreSQL (AWS Singapore)

---

## 📸 Application Screenshots

### 📊 Dashboard & Workspaces
| 1. Dashboard Overview | 2. Workspaces Grid |
|---|---|
| ![Dashboard Overview](docs/images/dashboard/dashboard-1.png) | ![Workspaces Grid](docs/images/dashboard/dashboard-2.png) |

### 🗺️ Route Workspaces & Interactive Maps
| 1. Add Location & Vehicles | 2. Locations Grid & Time Windows |
|---|---|
| ![Add Locations & Vehicles](docs/images/workspace/workspace-1.png) | ![Locations Grid](docs/images/workspace/workspace-2.png) |

| 3. Routing Results Timeline | 4. Fullscreen Map Overlay |
|---|---|
| ![Routing Results Timeline](docs/images/workspace/workspace-3.png) | ![Fullscreen Map Overlay](docs/images/workspace/workspace-4.png) |

---

## ✨ Key Features

- **Delivery Fleet Optimization (CVRP)**: Multi-vehicle routing with load balancing and capacity bounds.
- **Trip Planner (TSP)**: Single-vehicle multi-destination itinerary routing.
- **Google OR-Tools Optimization**: Multi-strategy solver with Guided Local Search and Slack dimensions.
- **OSRM Road Network Routing**: Real-world driving duration and distance matrix calculations.
- **12-Hour AM/PM Time Windows**: Native clock pickers with hard/soft arrival constraint validation.
- **Resilient Multi-Tier Geocoding**: Dual Nominatim search with automatic **Photon OSM API** fallback.
- **Interactive Geospatial Maps**: Leaflet map overlays with color-coded vehicle polylines and fullscreen view.
- **Production Security**: JWT Auth, `bcrypt` hashing, Helmet headers, Rate Limiting, and Pino logging.

---

## 🏗️ Architecture

```mermaid
graph TD
    OSRM[Open Source Routing Machine]
    FastAPI[FastAPI Optimization Service]
    ORTools[Google OR-Tools]
    Client[Client Request]
    Node[Node.js / Express API Gateway]
    Prisma[Prisma ORM]
    DB[(PostgreSQL / Neon DB)]

    FastAPI -- Coordinates --> OSRM
    OSRM -- Distance & Time Matrix --> FastAPI
    
    FastAPI -- Constraints & Matrix --> ORTools
    ORTools -- Solved Routes --> FastAPI

    Node -- Optimize Payload --> FastAPI
    FastAPI -- JSON Result --> Node

    Client --> Node
    Node --> Prisma
    Prisma --> DB
```

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, React-Leaflet, Axios, Vanilla CSS
- **Backend API**: Node.js, Express.js, Prisma ORM, Pino Logger, Zod, Helmet, Rate Limit
- **Optimization Engine**: Python 3.10, FastAPI, Google OR-Tools, OSRM Engine
- **Database**: PostgreSQL (Neon Serverless)
- **Deployment**: Vercel (Frontend), Render (Backend & Engine), Cron-Job.org (Keep-Alive)

---

## 🚀 Quick Start

### 1. Node.js Backend
```bash
cd backend
npm install
npx prisma db push
npm run dev
```
> Running on `http://localhost:3000` | Swagger Specs: `http://localhost:3000/api-docs`

### 2. Python Optimization Engine
```bash
cd optimization-service
python -m venv .venv
# Windows: .venv\Scripts\activate | Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app:app --port 8000 --reload
```
> Running on `http://localhost:8000`

### 3. React Frontend
```bash
cd frontend
npm install
npm run dev
```
> Running on `http://localhost:5173`

---

## ⚙️ Environment Variables (`.env`)

```env
# Backend (.env)
DATABASE_URL="postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require"
JWT_SECRET="YourSuperSecretJWTKey"
CLIENT_URL="https://route-optimizer-ebon.vercel.app"
FASTAPI_URL="https://route-optimizer-python.onrender.com"
PORT=3000

# Frontend (.env)
VITE_API_BASE_URL="https://route-optimizer-backend-6ehr.onrender.com"
```

---

## 📑 API Endpoints

- `POST /auth/register` — Register a new user account
- `POST /auth/login` — Authenticate user and return JWT bearer token
- `POST /optimization` — Create a new routing job (`TRIP_PLANNER` or `DELIVERY`)
- `POST /optimization/:id/locations` — Add location(s) with demands and time windows
- `PATCH /optimization/:id` — Set Start & End locations
- `POST /optimization/:id/optimize` — Trigger Google OR-Tools route calculation
- `GET /optimization/:id/result` — Retrieve calculated routes, distance, and duration

---

## 🚀 Future Improvements

- 🔮 **Spatial Clustering (K-Means / DBSCAN)**: Pre-cluster locations to support **1,000+ stops**.
- 🗺️ **Google Maps API Integration**: Primary routing fallback for high-density enterprise traffic.
- ⚡ **Redis Route Caching**: Cache distance matrices for recurring locations for sub-100ms routing.

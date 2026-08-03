# Route Optimizer

A full-stack, microservice-based application that solves complex vehicle routing problems (VRP) and traveling salesperson problems (TSP). It calculates the most efficient delivery routes or trip itineraries across multiple locations and vehicles using real-world road networks.

## 🏗️ Architecture

This project is split into three distinct microservices to ensure high performance and scalability:

1. **Frontend (React + Vite)**: A lightning-fast, interactive UI built with React. It features real-time maps (via Leaflet), drag-and-drop job creation, and clear error handling.
2. **Backend API (Node.js + Express + Prisma)**: A robust REST API that handles user authentication (JWT), secure database storage (PostgreSQL), input validation (Zod), and orchestrates requests to the optimization engine. It is fully secured with Helmet, Rate Limiting, and centralized error handling.
3. **Optimization Service (Python + FastAPI)**: A dedicated, high-performance mathematical engine. It leverages **Google OR-Tools** to solve combinatorial routing algorithms and interacts with an **OSRM** (Open Source Routing Machine) server to get real street distances and driving durations.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18+)
- **Python** (3.10+)
- **PostgreSQL** (Running locally or hosted)

### 1. Database & Environment Setup
You will need two `.env` files to connect the microservices.

**Backend `.env`**
Create a `.env` file in the `backend/` directory:
```env
# PostgreSQL connection string
DATABASE_URL="postgresql://username:password@localhost:5432/route_optimizer"

# Secret key for signing JWT auth tokens
JWT_SECRET="YourSuperSecretKey123!"

# Points to the local Python optimization service
FASTAPI_URL="http://localhost:8000"
```

**Frontend `.env`**
Create a `.env` file in the `frontend/` directory:
```env
# Points to the local Node.js backend
VITE_API_BASE_URL="http://localhost:3000"
```

### 2. Start the Node.js Backend
```bash
cd backend
npm install

# Push the Prisma schema to your PostgreSQL database
npx prisma db push

# Start the server (runs on http://localhost:3000)
npm run dev
```

### 3. Start the Python Optimization Engine
```bash
cd optimization-service

# (Recommended) Create a virtual environment
python -m venv .venv
source .venv/bin/activate  # Or `.venv\Scripts\activate` on Windows

# Install math and routing dependencies
pip install -r requirements.txt

# Start the FastAPI server (runs on http://localhost:8000)
uvicorn app:app --reload
```

### 4. Start the React Frontend
```bash
cd frontend
npm install

# Start the Vite development server
npm run dev
```

---

## ✨ Features

* **Two Routing Modes**: 
  * **Delivery Run**: Solve the Capacitated Vehicle Routing Problem (CVRP) by assigning varying package demands to a fleet of limited-capacity vehicles.
  * **Trip Planner**: Solve the Traveling Salesperson Problem (TSP) by finding the absolute fastest path through a series of stops for a single vehicle.
* **Smart Fallbacks**: If a location cannot be reached or the fleet capacity is too small, the engine utilizes Guided Local Search and Disjunctions to cleanly drop unreachable stops instead of crashing.
* **Security First**: The Node API is locked down with global `errorHandler` middleware, Zod strict schema validation, Express Rate Limiting, and Helmet HTTP headers.
* **Interactive Maps**: Visualize your optimized routes on a real, interactive map interface immediately after the engine completes its calculations.

## 📚 API Documentation
The Node.js backend includes a fully up-to-date OpenAPI/Swagger specification.
You can view the raw specification in `backend/swagger.yaml` to easily import the endpoints into Postman or Insomnia.

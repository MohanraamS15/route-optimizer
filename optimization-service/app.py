from fastapi import FastAPI

from osrm.service import get_matrix
from optimizer.solver import solve_route
from models.request import OptimizeRequest


app = FastAPI()


@app.get("/")
def home():
    return {
        "message": "Optimization Service Running 🚀"
    }


@app.post("/optimize")
def optimize(request: OptimizeRequest):

    coordinates = request.coordinates

    time_matrix, distance_matrix = get_matrix(
        coordinates
    )

    routes = solve_route(
        time_matrix,
        request.num_vehicles,
        request.depot,
        request.demands,
        request.vehicle_capacities
    )

    return {
        "routes": routes,
        "time_matrix": time_matrix,
        "distance_matrix": distance_matrix,
    }
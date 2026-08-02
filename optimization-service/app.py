import time

from fastapi import FastAPI

from osrm.service import get_matrix
from optimizer.solver import solve_route
from models.request import OptimizeRequest

app = FastAPI()


def build_response(
    routes,
    demands,
    distance_matrix,
    time_matrix,
):
    response_routes = []

    total_distance = 0
    total_duration = 0

    for vehicle_id, route in enumerate(routes):

        load = 0
        distance = 0
        duration = 0

        for i in range(len(route) - 1):

            from_node = route[i]
            to_node = route[i + 1]

            distance += distance_matrix[from_node][to_node]
            duration += time_matrix[from_node][to_node]

            load += demands[to_node]

        response_routes.append(
            {
                "vehicle_id": vehicle_id,
                "route": route,
                "load": load,
                "distance": round(distance, 2),
                "duration": round(duration, 2),
            }
        )

        total_distance += distance
        total_duration += duration

    return {
        "routes": response_routes,
        "total_distance": round(total_distance, 2),
        "total_duration": round(total_duration, 2),
    }


@app.get("/")
def home():
    return {"message": "Optimization Service Running 🚀"}


@app.post("/optimize")
def optimize(request: OptimizeRequest):

    coordinates = request.coordinates

    time_matrix, distance_matrix = get_matrix(coordinates)

    routes = solve_route(
        time_matrix=time_matrix,
        num_vehicles=request.num_vehicles,
        depot=request.depot,
        demands=request.demands,
        vehicle_capacities=request.vehicle_capacities,
        time_windows=request.time_windows,
    )

    return build_response(
        routes,
        request.demands,
        distance_matrix,
        time_matrix,
    )

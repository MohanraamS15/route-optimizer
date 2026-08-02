import time

from fastapi import FastAPI
from fastapi import HTTPException
from osrm.service import get_matrix
from optimizer.solver import solve_route
from models.request import OptimizeRequest
from models.response import OptimizeResponse
from validators.request_validator import validate_request
from utils.response_builder import build_response

app = FastAPI()



@app.get("/")
def home():
    return {"message": "Optimization Service Running 🚀"}


@app.post("/optimize",response_model=OptimizeResponse)  
def optimize(request: OptimizeRequest):

    validate_request(request)

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
    
    if routes is None:
        raise HTTPException(
            status_code=400,
            detail="No feasible route found for the given constraints."
        )

    return build_response(
        routes,
        request.demands,
        distance_matrix,
        time_matrix,
    )

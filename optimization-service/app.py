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
    
    print("1. Request validated")
    
    validate_request(request)

    coordinates = request.coordinates

    print("2. Validation completed")

    try:
        time_matrix, distance_matrix = get_matrix(coordinates)
        print("3. OSRM completed")
    except Exception as e:
        print(f"OSRM Error: {e}")
        raise HTTPException(
            status_code=400,
            detail="Failed to calculate road distances between locations. Please ensure all locations are valid drivable addresses."
        )

    try:
        routes = solve_route(
            time_matrix=time_matrix,
            num_vehicles=request.num_vehicles,
            start_index=request.start_index,
            end_index=request.end_index,
            demands=request.demands,
            vehicle_capacities=request.vehicle_capacities,
            time_windows=request.time_windows,
        )
    except Exception as e:
        print(f"Solver Exception: {e}")
        raise HTTPException(
            status_code=400,
            detail="Optimization solver encountered an error. Please verify your vehicle capacities and time windows."
        )
    
    if routes is None:
        raise HTTPException(
            status_code=400,
            detail="No feasible route found for the given constraints."
        )
        
    print("4. Solver completed")

    return build_response(
        routes,
        request.demands,
        distance_matrix,
        time_matrix,
        request.time_windows,
    )

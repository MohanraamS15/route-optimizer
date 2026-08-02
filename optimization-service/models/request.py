from pydantic import BaseModel


class OptimizeRequest(BaseModel):
    coordinates: list[list[float]]
    num_vehicles: int
    depot:int
    demands:list[int]
    vehicle_capacities:list[int]
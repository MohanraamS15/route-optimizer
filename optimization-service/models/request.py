from pydantic import BaseModel


class OptimizeRequest(BaseModel):
    coordinates: list[list[float]]

    num_vehicles: int

    start_index: int
    end_index: int

    demands: list[int]

    vehicle_capacities: list[int]

    time_windows: list[list[int]]
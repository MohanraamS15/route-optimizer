from pydantic import BaseModel
from typing import List, Optional

class StopResponse(BaseModel):
    location_index: int
    distance_from_previous: Optional[float]

class RouteResponse(BaseModel):
    vehicle_id: int
    route: list[int]
    stops: List[StopResponse]
    load: int
    distance: float
    duration: float


class OptimizeResponse(BaseModel):
    routes: list[RouteResponse]
    total_distance: float
    total_duration: float
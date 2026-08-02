from pydantic import BaseModel


class RouteResponse(BaseModel):
    vehicle_id: int
    route: list[int]
    load: int
    distance: float
    duration: float


class OptimizeResponse(BaseModel):
    routes: list[RouteResponse]
    total_distance: float
    total_duration: float
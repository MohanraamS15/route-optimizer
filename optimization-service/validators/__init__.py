from fastapi import HTTPException


def validate_request(request):

    if len(request.coordinates) != len(request.demands):
        raise HTTPException(
            status_code=400,
            detail="Coordinates and demands must have the same length."
        )

    if len(request.coordinates) != len(request.time_windows):
        raise HTTPException(
            status_code=400,
            detail="Coordinates and time windows must have the same length."
        )

    if len(request.vehicle_capacities) != request.num_vehicles:
        raise HTTPException(
            status_code=400,
            detail="Vehicle capacities must match num_vehicles."
        )
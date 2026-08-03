from fastapi import HTTPException


def validate_request(request):

    # ------------------------
    # Basic Length Validation
    # ------------------------

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

    # ------------------------
    # Start / End Index Validation
    # ------------------------

    total_locations = len(request.coordinates)

    if request.start_index < 0 or request.start_index >= total_locations:
        raise HTTPException(
            status_code=400,
            detail="Invalid start_index."
        )

    if request.end_index < 0 or request.end_index >= total_locations:
        raise HTTPException(
            status_code=400,
            detail="Invalid end_index."
        )

    # ------------------------
    # Minimum Locations
    # ------------------------

    if total_locations < 2:
        raise HTTPException(
            status_code=400,
            detail="At least 2 locations are required."
        )

    # ------------------------
    # Vehicle Count
    # ------------------------

    if request.num_vehicles <= 0:
        raise HTTPException(
            status_code=400,
            detail="Number of vehicles must be greater than zero."
        )
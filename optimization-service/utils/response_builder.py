
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
        
        stops = []
        for i, node in enumerate(route):
            if i == 0:
                dist_prev = 0
            else:
                dist_prev = distance_matrix[route[i-1]][node]
            
            stops.append({
                "location_index": node,
                "distance_from_previous": round(dist_prev, 2)
            })

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
                "stops": stops,
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

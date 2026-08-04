
def build_response(
    routes,
    demands,
    distance_matrix,
    time_matrix,
    time_windows=None,
):
    response_routes = []

    total_distance = 0
    total_duration = 0
    has_constraint_warning = False

    for vehicle_id, route in enumerate(routes):

        load = 0
        distance = 0
        duration = 0
        cumul_time = 0
        
        stops = []
        for i, node in enumerate(route):
            if i == 0:
                dist_prev = 0
                if time_windows and node < len(time_windows):
                    cumul_time = time_windows[node][0]
            else:
                dist_prev = distance_matrix[route[i-1]][node]
                cumul_time += time_matrix[route[i-1]][node]

            # Check if arrival exceeds time window end
            if time_windows and node < len(time_windows):
                tw_end = time_windows[node][1]
                if tw_end < 86400 and cumul_time > tw_end + 60: # 60s tolerance buffer
                    has_constraint_warning = True

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
        "has_constraint_warning": has_constraint_warning,
    }

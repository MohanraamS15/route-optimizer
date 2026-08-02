from ortools.constraint_solver import pywrapcp
from ortools.constraint_solver import routing_enums_pb2


def solve_route(
    time_matrix,
    num_vehicles,
    depot,
    demands,
    vehicle_capacities,
    time_windows,
):

    manager = pywrapcp.RoutingIndexManager(
        len(time_matrix),
        num_vehicles,
        depot,
    )

    routing = pywrapcp.RoutingModel(manager)

    # Time Callback

    def time_callback(from_index, to_index):

        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)

        return int(time_matrix[from_node][to_node])

    transit_callback = routing.RegisterTransitCallback(time_callback)

    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback)

    # Demand Callback

    def demand_callback(from_index):

        from_node = manager.IndexToNode(from_index)

        return demands[from_node]

    demand_callback_index = routing.RegisterUnaryTransitCallback(demand_callback)

    # Capacity Dimension

    routing.AddDimensionWithVehicleCapacity(
        demand_callback_index,
        0,
        vehicle_capacities,
        True,
        "Capacity",
    )
    
    # ------------------------
    # Time Dimension
    # ------------------------

    routing.AddDimension(
        transit_callback,
        30,
        3000,
        False,
        "Time",
    )

    time_dimension = routing.GetDimensionOrDie("Time")

    for location_idx, time_window in enumerate(time_windows):

        if location_idx == depot:
            continue

        index = manager.NodeToIndex(location_idx)

        time_dimension.CumulVar(index).SetRange(
            time_window[0],
            time_window[1],
        )

    depot_index = manager.NodeToIndex(depot)

    time_dimension.CumulVar(depot_index).SetRange(
        time_windows[depot][0],
        time_windows[depot][1],
    )

    # Search Parameters

    search_parameters = pywrapcp.DefaultRoutingSearchParameters()

    search_parameters.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    )

    solution = routing.SolveWithParameters(search_parameters)

    if not solution:
        return None

    # Extract Routes

    routes = []

    for vehicle_id in range(num_vehicles):

        route = []

        index = routing.Start(vehicle_id)

        while not routing.IsEnd(index):

            route.append(manager.IndexToNode(index))

            index = solution.Value(routing.NextVar(index))

        route.append(manager.IndexToNode(index))

        # Ignore unused vehicles
        # if len(route) > 2:
        routes.append(route)

    return routes

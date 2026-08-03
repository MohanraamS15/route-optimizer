from ortools.constraint_solver import pywrapcp
from ortools.constraint_solver import routing_enums_pb2


def solve_route(
    time_matrix,
    num_vehicles,
    start_index,
    end_index,
    demands,
    vehicle_capacities,
    time_windows,
):
    # One start and one end for every vehicle
    starts = [start_index] * num_vehicles
    ends = [end_index] * num_vehicles

    manager = pywrapcp.RoutingIndexManager(
        len(time_matrix),
        num_vehicles,
        starts,
        ends,
    )

    routing = pywrapcp.RoutingModel(manager)

    # ------------------------
    # Time Callback
    # ------------------------

    def time_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)

        return int(time_matrix[from_node][to_node])

    transit_callback = routing.RegisterTransitCallback(time_callback)

    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback)

    # ------------------------
    # Demand Callback
    # ------------------------

    def demand_callback(from_index):
        from_node = manager.IndexToNode(from_index)
        return demands[from_node]

    demand_callback_index = routing.RegisterUnaryTransitCallback(
        demand_callback
    )

    # ------------------------
    # Capacity Dimension
    # ------------------------

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
        86400,
        False,
        "Time",
    )

    # Allow dropping nodes with a penalty so it never fails completely
    # Penalty should be large enough that it only drops if absolutely necessary
    penalty = 10000000
    for node in range(len(time_matrix)):
        if node == start_index or node == end_index:
            continue
        routing.AddDisjunction([manager.NodeToIndex(node)], penalty)

    time_dimension = routing.GetDimensionOrDie("Time")

    # Apply time windows to all customer locations
    for location_idx, time_window in enumerate(time_windows):
        if location_idx == start_index or location_idx == end_index:
            continue

        index = manager.NodeToIndex(location_idx)
        time_dimension.CumulVar(index).SetRange(
            time_window[0],
            time_window[1],
        )

    # Apply the start and end time windows to every vehicle's start and end nodes
    for vehicle_id in range(num_vehicles):
        start = routing.Start(vehicle_id)
        time_dimension.CumulVar(start).SetRange(
            time_windows[start_index][0],
            time_windows[start_index][1],
        )

        end = routing.End(vehicle_id)
        time_dimension.CumulVar(end).SetRange(
            time_windows[end_index][0],
            time_windows[end_index][1],
        )

    # ------------------------
    # Search Parameters
    # ------------------------

    search_parameters = pywrapcp.DefaultRoutingSearchParameters()

    search_parameters.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PARALLEL_CHEAPEST_INSERTION
    )
    
    # Enable Guided Local Search to escape local minima
    search_parameters.local_search_metaheuristic = (
        routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    )
    search_parameters.time_limit.FromSeconds(2) # 2 seconds time limit for local search

    print("Before Solve")

    solution = routing.SolveWithParameters(search_parameters)

    print("After Solve")

    if solution is None:
        return None

    # ------------------------
    # Extract Routes
    # ------------------------

    routes = []

    for vehicle_id in range(num_vehicles):

        route = []

        index = routing.Start(vehicle_id)

        while not routing.IsEnd(index):

            route.append(manager.IndexToNode(index))

            index = solution.Value(routing.NextVar(index))

        route.append(manager.IndexToNode(index))

        routes.append(route)

    return routes
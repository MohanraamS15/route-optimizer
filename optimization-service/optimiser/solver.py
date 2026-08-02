from ortools.constraint_solver import pywrapcp
from ortools.constraint_solver import routing_enums_pb2


def solve_route(time_matrix):

    manager = pywrapcp.RoutingIndexManager(
        len(time_matrix),
        1,
        0,
    )

    routing = pywrapcp.RoutingModel(manager)

    def time_callback(from_index, to_index):

        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)

        return int(time_matrix[from_node][to_node])

    transit_callback = routing.RegisterTransitCallback(
        time_callback
    )

    routing.SetArcCostEvaluatorOfAllVehicles(
        transit_callback
    )

    search_parameters = pywrapcp.DefaultRoutingSearchParameters()

    search_parameters.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    )

    solution = routing.SolveWithParameters(
        search_parameters
    )

    if not solution:
        return None

    route = []

    index = routing.Start(0)

    while not routing.IsEnd(index):
        route.append(manager.IndexToNode(index))
        index = solution.Value(
            routing.NextVar(index)
        )

    route.append(manager.IndexToNode(index))

    return route
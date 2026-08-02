from ortools.constraint_solver import pywrapcp
from ortools.constraint_solver import routing_enums_pb2


def create_data_model():
    return {
        "time_matrix": [
            [0, 6, 9, 8, 7],
            [6, 0, 5, 4, 3],
            [9, 5, 0, 7, 6],
            [8, 4, 7, 0, 5],
            [7, 3, 6, 5, 0],
        ],

        "time_windows": [
            (0, 100),   # Depot
            (20, 50),    # Customer 1
            (10, 30),   # Customer 2
            (15, 40),   # Customer 3
            (5, 20),   # Customer 4
        ],

        "num_vehicles": 1,
        "depot": 0,
    }


def print_solution(data, manager, routing, solution):

    time_dimension = routing.GetDimensionOrDie("Time")

    index = routing.Start(0)

    print("Route")

    while not routing.IsEnd(index):

        node = manager.IndexToNode(index)

        time_var = time_dimension.CumulVar(index)

        print(
            f"{node} Time({solution.Min(time_var)})",
            end=" -> ",
        )

        index = solution.Value(
            routing.NextVar(index)
        )

    node = manager.IndexToNode(index)

    time_var = time_dimension.CumulVar(index)

    print(f"{node} Time({solution.Min(time_var)})")


def main():

    data = create_data_model()

    manager = pywrapcp.RoutingIndexManager(
        len(data["time_matrix"]),
        data["num_vehicles"],
        data["depot"],
    )

    routing = pywrapcp.RoutingModel(manager)

    def time_callback(from_index, to_index):

        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)

        return data["time_matrix"][from_node][to_node]

    transit_callback_index = routing.RegisterTransitCallback(
        time_callback
    )

    routing.SetArcCostEvaluatorOfAllVehicles(
        transit_callback_index
    )

    routing.AddDimension(
        transit_callback_index,
        30,
        100,
        False,
        "Time",
    )

    time_dimension = routing.GetDimensionOrDie("Time")

    for location_idx, time_window in enumerate(data["time_windows"]):

        if location_idx == data["depot"]:
            continue

        index = manager.NodeToIndex(location_idx)

        time_dimension.CumulVar(index).SetRange(
            time_window[0],
            time_window[1],
        )

    depot_idx = manager.NodeToIndex(data["depot"])

    time_dimension.CumulVar(depot_idx).SetRange(0, 100)

    search_parameters = pywrapcp.DefaultRoutingSearchParameters()

    search_parameters.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    )

    solution = routing.SolveWithParameters(search_parameters)

    if solution:
        print_solution(
            data,
            manager,
            routing,
            solution,
        )
    else:
        print("No Solution Found")


if __name__ == "__main__":
    main()
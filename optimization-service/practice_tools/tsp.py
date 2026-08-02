from ortools.constraint_solver import pywrapcp
from ortools.constraint_solver import routing_enums_pb2


def create_data_model():
    return {
        "distance_matrix": [
            [0, 5, 8, 6],
            [5, 0, 3, 4],
            [8, 3, 0, 2],
            [6, 4, 2, 0],
        ],
        "num_vehicles": 1,
        "depot": 0,
    }


def print_solution(data, manager, routing, solution):
    print("Objective:", solution.ObjectiveValue())

    index = routing.Start(0)

    print("Route:")

    while not routing.IsEnd(index):
        print(manager.IndexToNode(index), end=" -> ")
        index = solution.Value(routing.NextVar(index))

    print(manager.IndexToNode(index))


def main():

    data = create_data_model()

    manager = pywrapcp.RoutingIndexManager(
        len(data["distance_matrix"]),
        data["num_vehicles"],
        data["depot"],
    )

    routing = pywrapcp.RoutingModel(manager)

    def distance_callback(from_index, to_index):

        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)

        return data["distance_matrix"][from_node][to_node]

    transit_callback_index = routing.RegisterTransitCallback(
        distance_callback
    )

    routing.SetArcCostEvaluatorOfAllVehicles(
        transit_callback_index
    )

    search_parameters = pywrapcp.DefaultRoutingSearchParameters()

    search_parameters.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    )

    solution = routing.SolveWithParameters(search_parameters)

    if solution:
        print_solution(data, manager, routing, solution)


if __name__ == "__main__":
    main()
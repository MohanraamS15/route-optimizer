import requests

from ortools.constraint_solver import pywrapcp
from ortools.constraint_solver import routing_enums_pb2


def get_time_matrix():

    coordinates = [
        (80.2337, 13.0418),
        (80.2707, 13.0827),
        (80.2500, 13.0600),
    ]

    coordinate_string = ";".join(
        f"{lon},{lat}"
        for lon, lat in coordinates
    )

    url = (
        f"https://router.project-osrm.org/table/v1/driving/"
        f"{coordinate_string}"
        f"?annotations=duration"
    )

    response = requests.get(url)

    return response.json()["durations"]


def create_data_model():

    return {
        "time_matrix": get_time_matrix(),
        "num_vehicles": 1,
        "depot": 0,
    }


def print_solution(manager, routing, solution):

    index = routing.Start(0)

    print("Optimized Route")

    while not routing.IsEnd(index):

        print(
            manager.IndexToNode(index),
            end=" -> ",
        )

        index = solution.Value(
            routing.NextVar(index)
        )

    print(manager.IndexToNode(index))


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

        return int(
            data["time_matrix"][from_node][to_node]
        )

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

    if solution:
        print_solution(
            manager,
            routing,
            solution,
        )


if __name__ == "__main__":
    main()
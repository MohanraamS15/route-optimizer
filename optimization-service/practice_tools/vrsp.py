from ortools.constraint_solver import pywrapcp
from ortools.constraint_solver import routing_enums_pb2


def create_data_model():
    return {
        "distance_matrix": [
            [0, 5, 8, 6, 7, 3, 9],
            [5, 0, 4, 2, 6, 7, 3],
            [8, 4, 0, 5, 3, 6, 4],
            [6, 2, 5, 0, 7, 4, 5],
            [7, 6, 3, 7, 0, 2, 4],
            [3, 7, 6, 4, 2, 0, 5],
            [9, 3, 4, 5, 4, 5, 0],
        ],

        "demands": [
            0,  # Depot
            4,
            6,
            5,
            3,
            2,
            4,
        ],

        "vehicle_capacities": [
            10,
            10,
            10,
        ],

        "num_vehicles": 3,
        "depot": 0,
    }


def print_solution(data, manager, routing, solution):

    print("Objective:", solution.ObjectiveValue())

    for vehicle_id in range(data["num_vehicles"]):

        index = routing.Start(vehicle_id)

        route_load = 0

        print(f"\nRoute for Vehicle {vehicle_id}")

        while not routing.IsEnd(index):

            node = manager.IndexToNode(index)

            route_load += data["demands"][node]

            print(f"{node}(Load:{route_load})", end=" -> ")

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

    def demand_callback(from_index):

        from_node = manager.IndexToNode(from_index)

        return data["demands"][from_node]

    demand_callback_index = routing.RegisterUnaryTransitCallback(
        demand_callback
    )

    routing.AddDimensionWithVehicleCapacity(
        demand_callback_index,
        0,
        data["vehicle_capacities"],
        True,
        "Capacity",
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
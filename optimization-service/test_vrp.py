import sys
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp

def main():
    time_matrix = [
        [0, 100, 100, 100, 100],
        [100, 0, 100, 100, 100],
        [100, 100, 0, 100, 100],
        [100, 100, 100, 0, 100],
        [100, 100, 100, 100, 0]
    ]
    num_vehicles = 3
    start_index = 4
    end_index = 4
    starts = [start_index] * num_vehicles
    ends = [end_index] * num_vehicles
    demands = [4, 1, 2, 2, 0]
    vehicle_capacities = [2, 5, 4]
    time_windows = [
        [0, 86400],
        [0, 86400],
        [0, 86400],
        [0, 86400],
        [0, 86400]
    ]

    manager = pywrapcp.RoutingIndexManager(len(time_matrix), num_vehicles, starts, ends)
    routing = pywrapcp.RoutingModel(manager)

    def transit_callback(from_index, to_index):
        return int(time_matrix[manager.IndexToNode(from_index)][manager.IndexToNode(to_index)])
    transit_callback_idx = routing.RegisterTransitCallback(transit_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_idx)

    def demand_callback(from_index):
        return demands[manager.IndexToNode(from_index)]
    demand_callback_idx = routing.RegisterUnaryTransitCallback(demand_callback)

    routing.AddDimensionWithVehicleCapacity(
        demand_callback_idx, 0, vehicle_capacities, True, 'Capacity'
    )

    routing.AddDimension(
        transit_callback_idx,
        30,
        86400,
        False,
        "Time",
    )
    time_dimension = routing.GetDimensionOrDie("Time")
    for location_idx, time_window in enumerate(time_windows):
        if location_idx == start_index or location_idx == end_index:
            continue
        index = manager.NodeToIndex(location_idx)
        time_dimension.CumulVar(index).SetRange(time_window[0], time_window[1])

    for vehicle_id in range(num_vehicles):
        start = routing.Start(vehicle_id)
        time_dimension.CumulVar(start).SetRange(time_windows[start_index][0], time_windows[start_index][1])
        end = routing.End(vehicle_id)
        time_dimension.CumulVar(end).SetRange(time_windows[end_index][0], time_windows[end_index][1])

    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = routing_enums_pb2.FirstSolutionStrategy.PARALLEL_CHEAPEST_INSERTION
    search_parameters.local_search_metaheuristic = routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    search_parameters.time_limit.FromSeconds(2)
    
    solution = routing.SolveWithParameters(search_parameters)
    print('Solution found:', solution is not None)

if __name__ == '__main__':
    main()

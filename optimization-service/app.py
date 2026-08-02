from osrm.service import get_matrix
from optimizer.solver import solve_route


coordinates = [
    (80.2337, 13.0418),
    (80.2707, 13.0827),
    (80.2500, 13.0600),
]


time_matrix, distance_matrix = get_matrix(coordinates)

route = solve_route(time_matrix)

print("Optimized Route")
print(route)
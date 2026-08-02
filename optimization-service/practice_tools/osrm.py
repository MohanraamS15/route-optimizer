import requests

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
    f"?annotations=duration,distance"
)

response = requests.get(url)

data = response.json()

print("Duration Matrix")
print(data["durations"])

print()

print("Distance Matrix")
print(data["distances"])
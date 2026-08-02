import requests


def get_matrix(coordinates):

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
    response.raise_for_status()

    data = response.json()

    return (
        data["durations"],
        data["distances"],
    )
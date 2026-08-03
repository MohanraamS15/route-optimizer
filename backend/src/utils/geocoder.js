export async function geocodeAddress(address) {
  try {

    const encodedAddress = encodeURIComponent(address);
    
    const url = `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1`;

    
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Route-Optimizer/1.0",
      },
    });

    
    if (!response.ok) {
      throw new Error("Failed to fetch coordinates from Nominatim.");
    }

    
    const data = await response.json();

    
    if (!data.length) {
      throw new Error("Address not found.");
    }

    
    return {
      latitude: Number(data[0].lat),
      longitude: Number(data[0].lon),
      formattedAddress: data[0].display_name,
    };
  } catch (error) {
    throw new Error(error.message);
  }
}
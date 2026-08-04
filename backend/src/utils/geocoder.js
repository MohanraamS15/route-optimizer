export async function geocodeAddress(address) {
  try {
    const encodedAddress = encodeURIComponent(address);
    
    // 1. Try Nominatim India search
    let url = `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1&countrycodes=in`;
    let response = await fetch(url, {
      headers: { "User-Agent": "Route-Optimizer-App/1.0 (contact@routeoptimizer.dev)" }
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.length > 0) {
        return {
          latitude: Number(data[0].lat),
          longitude: Number(data[0].lon),
          formattedAddress: data[0].display_name,
        };
      }
    }

    // 2. Try Nominatim Global search
    url = `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1`;
    response = await fetch(url, {
      headers: { "User-Agent": "Route-Optimizer-App/1.0 (contact@routeoptimizer.dev)" }
    });
    if (response.ok) {
      const data = await response.json();
      if (data && data.length > 0) {
        return {
          latitude: Number(data[0].lat),
          longitude: Number(data[0].lon),
          formattedAddress: data[0].display_name,
        };
      }
    }

    // 3. Fallback to Photon OSM Geocoder (Fast & unlimited)
    url = `https://photon.komoot.io/api/?q=${encodedAddress}&limit=1`;
    response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (data && data.features && data.features.length > 0) {
        const feat = data.features[0];
        const props = feat.properties;
        const nameParts = [props.name, props.street, props.city, props.state, props.country].filter(Boolean);
        return {
          latitude: Number(feat.geometry.coordinates[1]),
          longitude: Number(feat.geometry.coordinates[0]),
          formattedAddress: nameParts.join(", ") || address,
        };
      }
    }

    throw new Error("Address not found.");
  } catch (error) {
    throw new Error(error.message);
  }
}
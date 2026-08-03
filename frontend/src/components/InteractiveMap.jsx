import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import L from "leaflet";

// Create a custom SVG icon function
const createCustomIcon = (color) => {
  return new L.DivIcon({
    html: `
      <svg width="30" height="42" viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(2px 4px 6px rgba(0,0,0,0.3));">
        <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24c0-6.627-5.373-12-12-12zm0 17c-2.761 0-5-2.239-5-5s2.239-5 5-5 5 2.239 5 5-2.239 5-5 5z" fill="${color}" stroke="white" stroke-width="1.5"/>
      </svg>`,
    className: "", // Remove default div styling
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -40]
  });
};

const blueIcon = createCustomIcon("#3b82f6"); // Blue for intermediate
const greenIcon = createCustomIcon("#22c55e"); // Green for Start
const redIcon = createCustomIcon("#ef4444"); // Red for End

const VEHICLE_COLORS = [
  "#FF0000", "#0000FF", "#008000", "#FFA500", "#800080", 
  "#00FFFF", "#FF00FF", "#A52A2A", "#000000", "#808080"
];

// Helper to determine the correct icon and label based on index
const getMarkerProps = (idx, job) => {
  if (idx === job?.startIndex && idx === job?.endIndex) {
    return { icon: greenIcon, label: "(Start & End)", color: "green" };
  }
  if (idx === job?.startIndex) {
    return { icon: greenIcon, label: "(Start Location)", color: "green" };
  }
  if (idx === job?.endIndex) {
    return { icon: redIcon, label: "(End Location)", color: "red" };
  }
  return { icon: blueIcon, label: null, color: null };
};

export default function InteractiveMap({ locations, optimizationResult, job }) {
  const defaultCenter = locations.length > 0 
    ? [locations[0].latitude, locations[0].longitude] 
    : [13.0827, 80.2707];

  return (
    <div style={{ height: "400px", width: "100%", border: "1px solid #ccc", borderRadius: "8px", overflow: "hidden" }}>
      <MapContainer center={defaultCenter} zoom={11} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {!optimizationResult && locations.map((loc, idx) => {
          const { icon, label, color } = getMarkerProps(idx, job);
          
          return (
            <Marker 
              key={loc.id} 
              position={[loc.latitude, loc.longitude]}
              icon={icon}
            >
              <Popup>
                <strong>{idx}. {loc.address}</strong>
                {label && <div style={{ color }}>{label}</div>}
              </Popup>
            </Marker>
          );
        })}

        {optimizationResult && optimizationResult.routes?.map((route, routeIdx) => {
          const color = VEHICLE_COLORS[route.vehicleIndex % VEHICLE_COLORS.length];
          const polylinePositions = route.stops.map(stop => [stop.latitude, stop.longitude]);

          return (
            <div key={`vehicle-${route.vehicleIndex}`}>
              <Polyline positions={polylinePositions} pathOptions={{ color, weight: 4 }} />
              
              {route.stops.map((stop, stopIndex) => {
                // In optimized route, we map the stop back to its original location logic.
                // But we don't have the original 'idx' readily available in the stop object (except in address/sequence context).
                // However, sequence 1 is Start, last sequence is End.
                
                let iconToUse = blueIcon;
                let textLabel = null;
                let textColor = null;

                if (stopIndex === 0 && stopIndex === route.stops.length - 1) {
                  iconToUse = greenIcon;
                  textLabel = "(Start & End)";
                  textColor = "green";
                } else if (stopIndex === 0) {
                  iconToUse = greenIcon;
                  textLabel = "(Start Location)";
                  textColor = "green";
                } else if (stopIndex === route.stops.length - 1) {
                  iconToUse = redIcon;
                  textLabel = "(End Location)";
                  textColor = "red";
                }

                return (
                  <Marker 
                    key={`${route.vehicleIndex}-${stop.sequence}`} 
                    position={[stop.latitude, stop.longitude]}
                    icon={iconToUse}
                  >
                    <Popup>
                      <strong>Vehicle {route.vehicleIndex + 1}</strong><br/>
                      Stop #{stop.sequence}: {stop.address}
                      {textLabel && <div style={{ color: textColor }}>{textLabel}</div>}
                    </Popup>
                  </Marker>
                );
              })}
            </div>
          );
        })}
      </MapContainer>
    </div>
  );
}

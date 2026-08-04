import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

/* ── Icons ── */
const createCustomIcon = (color) =>
  new L.DivIcon({
    html: `
      <svg width="30" height="42" viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(2px 4px 6px rgba(0,0,0,0.3));">
        <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24c0-6.627-5.373-12-12-12zm0 17c-2.761 0-5-2.239-5-5s2.239-5 5-5 5 2.239 5 5-2.239 5-5 5z"
          fill="${color}" stroke="white" stroke-width="1.5"/>
      </svg>`,
    className: "",
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -40],
  });

const blueIcon  = createCustomIcon("#3b82f6");
const greenIcon = createCustomIcon("#22c55e");
const redIcon   = createCustomIcon("#ef4444");

const VEHICLE_COLORS = [
  "#e11d48", "#2563eb", "#16a34a", "#ea580c",
  "#7c3aed", "#0891b2", "#b45309",
];

const getMarkerProps = (idx, job) => {
  if (idx === job?.startIndex && idx === job?.endIndex) return { icon: greenIcon, label: "Start & End", color: "green" };
  if (idx === job?.startIndex)  return { icon: greenIcon, label: "Start Location", color: "green" };
  if (idx === job?.endIndex)    return { icon: redIcon,   label: "End Location",   color: "red" };
  return { icon: blueIcon, label: null, color: null };
};

/* ── Shared map content ── */
function MapContent({ locations, optimizationResult, job }) {
  return (
    <>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {!optimizationResult && locations
        .filter(l => l && l.latitude !== null && l.latitude !== undefined && !isNaN(Number(l.latitude)))
        .map((loc, idx) => {
          const { icon, label, color } = getMarkerProps(idx, job);
          return (
            <Marker key={loc.id} position={[Number(loc.latitude), Number(loc.longitude)]} icon={icon}>
              <Popup>
                <strong>{idx}. {loc.address}</strong>
                {label && <div style={{ color, marginTop: 4, fontSize: "0.85em" }}>({label})</div>}
              </Popup>
            </Marker>
          );
        })}

      {optimizationResult && optimizationResult.routes?.map((route) => {
        const color = VEHICLE_COLORS[route.vehicleIndex % VEHICLE_COLORS.length];
        const validStops = (route.stops || []).filter(
          s => s && s.latitude !== null && s.latitude !== undefined && !isNaN(Number(s.latitude))
        );
        const positions = validStops.map(s => [Number(s.latitude), Number(s.longitude)]);
        return (
          <div key={`v-${route.vehicleIndex}`}>
            {positions.length > 1 && <Polyline positions={positions} pathOptions={{ color, weight: 4 }} />}
            {validStops.map((stop, si) => {

              let icon = blueIcon, label = null, lColor = null;
              if (si === 0 && si === route.stops.length - 1) { icon = greenIcon; label = "Start & End"; lColor = "green"; }
              else if (si === 0) { icon = greenIcon; label = "Start"; lColor = "green"; }
              else if (si === route.stops.length - 1) { icon = redIcon; label = "End"; lColor = "red"; }
              return (
                <Marker key={`${route.vehicleIndex}-${stop.sequence}`} position={[stop.latitude, stop.longitude]} icon={icon}>
                  <Popup>
                    <strong>Vehicle {route.vehicleIndex + 1}</strong><br />
                    <span style={{ display: "block", marginTop: 4, fontSize: "0.9em" }}>Stop #{stop.sequence}: {stop.address}</span>
                    {label && <div style={{ color: lColor, marginTop: 2, fontSize: "0.8em" }}>({label})</div>}
                  </Popup>
                </Marker>
              );
            })}
          </div>
        );
      })}
    </>
  );
}

/* ── Main component ── */
export default function InteractiveMap({ locations, optimizationResult, job }) {
  const [expanded, setExpanded] = useState(false);

  const defaultCenter = locations.length > 0
    ? [locations[0].latitude, locations[0].longitude]
    : [13.0827, 80.2707];

  return (
    <>
      {/* ── Small default map ── */}
      <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden" }}>
        <div style={{ height: "240px", width: "100%" }}>
          <MapContainer center={defaultCenter} zoom={11} style={{ height: "100%", width: "100%" }}>
            <MapContent locations={locations} optimizationResult={optimizationResult} job={job} />
          </MapContainer>
        </div>

        {/* Fullscreen button — top-right corner over the map */}
        <button
          onClick={() => setExpanded(true)}
          title="Expand map"
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            zIndex: 999,
            background: "white",
            border: "1px solid #cbd5e1",
            borderRadius: "8px",
            padding: "6px 10px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "0.78rem",
            fontWeight: 600,
            color: "#0f172a",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            fontFamily: "Inter, sans-serif",
            transition: "all 0.2s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
          onMouseLeave={e => e.currentTarget.style.background = "white"}
        >
          {/* Expand icon */}
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
          </svg>
          Expand
        </button>
      </div>

      {/* ── Expanded overlay map ── */}
      {expanded && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9990,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            animation: "toastIn 0.25s ease",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setExpanded(false); }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "1100px",
              height: "80vh",
              maxHeight: "780px",
              background: "#fff",
              borderRadius: "16px",
              overflow: "hidden",
              boxShadow: "0 30px 60px rgba(0,0,0,0.4)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header bar */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.875rem 1.25rem",
              borderBottom: "1px solid #e2e8f0",
              background: "#f8fafc",
              flexShrink: 0,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#0d9488" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                </svg>
                <span style={{ fontWeight: 700, fontSize: "0.95rem", fontFamily: "Inter, sans-serif", color: "#0f172a" }}>
                  Route Map
                </span>
                {locations.length > 0 && (
                  <span style={{ fontSize: "0.78rem", color: "#64748b", fontFamily: "Inter, sans-serif" }}>
                    — {locations.length} locations
                  </span>
                )}
              </div>
              <button
                onClick={() => setExpanded(false)}
                style={{
                  background: "none",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  cursor: "pointer",
                  padding: "6px 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "#475569",
                  fontFamily: "Inter, sans-serif",
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#0f172a"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#475569"; }}
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                </svg>
                Close
              </button>
            </div>

            {/* Full map */}
            <div style={{ flex: 1, minHeight: 0 }}>
              <MapContainer center={defaultCenter} zoom={12} style={{ height: "100%", width: "100%" }}>
                <MapContent locations={locations} optimizationResult={optimizationResult} job={job} />
              </MapContainer>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

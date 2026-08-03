import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import InteractiveMap from "../components/InteractiveMap";

export default function JobWorkspace() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [locations, setLocations] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [savingVehicles, setSavingVehicles] = useState(false);
  
  // Form State
  const [address, setAddress] = useState("");
  const [demand, setDemand] = useState(0);
  const [timeWindowStart, setTimeWindowStart] = useState("");
  const [timeWindowEnd, setTimeWindowEnd] = useState("");
  const [loading, setLoading] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState(null);

  // Edit State
  const [editingLocationId, setEditingLocationId] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  const fetchJobDetails = async () => {
    try {
      const res = await axiosClient.get(`/optimization/${id}`);
      const fetchedJob = res.data.job || res.data.data;
      setJob(fetchedJob);
      if (fetchedJob.vehicles) {
        setVehicles(fetchedJob.vehicles);
      }
    } catch (err) {
      console.error("Failed to fetch job", err);
    }
  };

  const fetchLocations = async () => {
    try {
      const res = await axiosClient.get(`/optimization/${id}/locations`);
      setLocations(res.data.locations || []);
    } catch (err) {
      console.error("Failed to fetch locations", err);
    }
  };

  const fetchOptimizationResult = async () => {
    try {
      const res = await axiosClient.get(`/optimization/${id}/result`);
      setOptimizationResult(res.data.data);
    } catch (err) {
      console.error("No results yet or failed to fetch");
    }
  };

  const resetEndpoints = async () => {
    try {
      await axiosClient.patch(`/optimization/${id}`, {
        startIndex: null,
        endIndex: null,
      });
      setJob(prev => ({ ...prev, startIndex: null, endIndex: null }));
    } catch (err) {
      console.error("Failed to reset endpoints", err);
    }
  };

  useEffect(() => {
    fetchJobDetails();
    fetchLocations();
    fetchOptimizationResult();
  }, [id]);

  const handleAddLocation = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = { address };
      
      if (job?.routeType === "DELIVERY") {
        payload.demand = parseInt(demand, 10);
      }
      
      if (timeWindowStart !== "") payload.timeWindowStart = parseInt(timeWindowStart, 10);
      if (timeWindowEnd !== "") payload.timeWindowEnd = parseInt(timeWindowEnd, 10);

      await axiosClient.post(`/optimization/${id}/locations`, {
        locations: [payload]
      });

      await resetEndpoints();
      fetchLocations();
      
      setAddress("");
      setDemand(0);
      setTimeWindowStart("");
      setTimeWindowEnd("");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to add location");
    } finally {
      setLoading(false);
    }
  };

  const handleSetEndpoints = async () => {
    try {
      await axiosClient.patch(`/optimization/${id}`, {
        startIndex: parseInt(job.startIndex, 10),
        endIndex: parseInt(job.endIndex, 10),
      });
      alert("Start and End locations saved!");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to set endpoints");
    }
  };

  const handleOptimize = async () => {
    if (job.startIndex === null || job.endIndex === null) {
      return alert("Please set the Start and End locations first!");
    }
    
    setLoading(true);
    try {
      await axiosClient.post(`/optimization/${id}/optimize`);
      alert("Optimization complete!");
      fetchJobDetails(); 
      fetchOptimizationResult();
    } catch (err) {
      alert(err.response?.data?.error || "Optimization failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVehicleChange = (index, field, value) => {
    const newVehicles = [...vehicles];
    newVehicles[index] = { ...newVehicles[index], [field]: value };
    setVehicles(newVehicles);
  };

  const handleSaveVehicles = async () => {
    setSavingVehicles(true);
    try {
      const payload = vehicles.map(v => ({
        ...v,
        capacity: parseInt(v.capacity, 10) || 1
      }));
      await axiosClient.put(`/optimization/${id}/vehicles`, { vehicles: payload });
      alert("Vehicles saved successfully!");
    } catch (err) {
      const errorData = err.response?.data?.error || err.response?.data;
      if (typeof errorData === 'object') {
        alert("Validation Error:\n" + JSON.stringify(errorData, null, 2));
      } else {
        alert(errorData || "Failed to save vehicles");
      }
    } finally {
      setSavingVehicles(false);
    }
  };

  const handleDeleteLocation = async (locationId) => {
    if (!window.confirm("Are you sure you want to delete this location?")) return;
    try {
      await axiosClient.delete(`/optimization/location/${locationId}`);
      await resetEndpoints();
      fetchLocations();
    } catch (err) {
      alert("Failed to delete location");
    }
  };

  const handleEditClick = (loc) => {
    setEditingLocationId(loc.id);
    setEditFormData({
      address: loc.address,
      demand: loc.demand ?? 0,
      timeWindowStart: loc.timeWindowStart ?? "",
      timeWindowEnd: loc.timeWindowEnd ?? "",
    });
  };

  const handleUpdateLocation = async (locationId) => {
    try {
      const payload = { address: editFormData.address };
      
      if (job?.routeType === "DELIVERY") {
        payload.demand = parseInt(editFormData.demand, 10) || 0;
      }
      
      if (editFormData.timeWindowStart !== "") {
        payload.timeWindowStart = parseInt(editFormData.timeWindowStart, 10);
      } else {
        payload.timeWindowStart = null;
      }
      
      if (editFormData.timeWindowEnd !== "") {
        payload.timeWindowEnd = parseInt(editFormData.timeWindowEnd, 10);
      } else {
        payload.timeWindowEnd = null;
      }

      await axiosClient.patch(`/optimization/location/${locationId}`, payload);
      setEditingLocationId(null);
      await resetEndpoints();
      fetchLocations();
    } catch (err) {
      const errorData = err.response?.data?.error || err.response?.data;
      console.error("Full error response:", err.response);
      
      if (typeof errorData === 'object') {
        // Stringify it nicely so it doesn't just say [object Object]
        alert("Error details:\n" + JSON.stringify(errorData, null, 2));
      } else {
        alert(errorData || "Failed to update location");
      }
    }
  };

  if (!job) return <div>Loading Workspace...</div>;

  const isDelivery = job.routeType === "DELIVERY";

  return (
    <div>
      <Link to="/dashboard">← Back to Dashboard</Link>
      
      <h1>Workspace: {job.jobName}</h1>
      <p>
        Mode: <strong>{job.routeType}</strong> {isDelivery && `| Vehicles: ${job.vehicleCount}`} | 
        Status: <strong>{job.status}</strong>
      </p>
      
      <hr />

      {isDelivery && vehicles.length > 0 && (
        <div style={{ background: "#f5f5f5", padding: "15px", marginBottom: "20px", border: "1px solid #ccc", borderRadius: "5px" }}>
          <h3>Step 2: Configure Vehicles</h3>
          {vehicles.map((v, index) => (
            <div key={v.id} style={{ display: "flex", gap: "10px", marginBottom: "10px", alignItems: "center" }}>
              <label style={{ width: "80px", fontWeight: "bold" }}>Vehicle {index + 1}</label>
              <input
                type="text"
                value={v.name}
                onChange={(e) => handleVehicleChange(index, "name", e.target.value)}
                placeholder="Name"
                style={{ padding: "5px" }}
              />
              {isDelivery && (
                <>
                  <label style={{ marginLeft: "15px" }}>Capacity: </label>
                  <input
                    type="number"
                    min="1"
                    value={v.capacity}
                    onChange={(e) => handleVehicleChange(index, "capacity", e.target.value)}
                    placeholder="Capacity"
                    style={{ padding: "5px", width: "80px" }}
                  />
                </>
              )}
            </div>
          ))}
          <button onClick={handleSaveVehicles} disabled={savingVehicles} style={{ marginTop: "10px", padding: "8px 15px", background: "#007bff", color: "white", border: "none", borderRadius: "4px" }}>
            {savingVehicles ? "Saving..." : "Save Vehicles"}
          </button>
        </div>
      )}

      <div style={{ display: "flex", gap: "20px" }}>
        
        {/* LEFT PANEL: Form and List */}
        <div style={{ flex: 1, borderRight: "1px solid #ccc", paddingRight: "20px" }}>
          
          <h3>Step 3: Add Locations</h3>
          <form onSubmit={handleAddLocation} style={{ border: "1px solid black", padding: "10px", marginBottom: "20px" }}>
            <div>
              <label>Address: </label>
              <input 
                type="text" 
                value={address} 
                onChange={(e) => setAddress(e.target.value)} 
                required 
                placeholder="e.g. Marina Beach, Chennai"
              />
            </div>

            {isDelivery && (
              <div style={{ margin: "10px 0" }}>
                <label>Demand (Packages): </label>
                <input 
                  type="number" 
                  min="0"
                  value={demand} 
                  onChange={(e) => setDemand(e.target.value)} 
                />
              </div>
            )}

            <div style={{ margin: "10px 0" }}>
              <label>Time Window Start (Seconds from Midnight, optional): </label>
              <input 
                type="number" 
                min="0"
                value={timeWindowStart} 
                onChange={(e) => setTimeWindowStart(e.target.value)} 
                placeholder="e.g. 32400 (9 AM)"
              />
            </div>
            
            <div style={{ margin: "10px 0" }}>
              <label>Time Window End (Seconds from Midnight, optional): </label>
              <input 
                type="number" 
                min="0"
                value={timeWindowEnd} 
                onChange={(e) => setTimeWindowEnd(e.target.value)} 
                placeholder="e.g. 61200 (5 PM)"
              />
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Location"}
            </button>
          </form>

          <h3>Location List ({locations.length})</h3>
          
          {locations.length >= 2 && (
            <div style={{ background: "#eee", padding: "10px", marginBottom: "15px" }}>
              <h4>Set Endpoints</h4>
              <label>Start Location: </label>
              <select 
                value={job.startIndex ?? ""} 
                onChange={(e) => setJob({...job, startIndex: e.target.value})}
              >
                <option value="" disabled>-- Select --</option>
                {locations.map((loc, idx) => (
                  <option key={loc.id} value={idx}>{idx}. {loc.address}</option>
                ))}
              </select>
              
              <br/><br/>
              
              <label>End Location: </label>
              <select 
                value={job.endIndex ?? ""} 
                onChange={(e) => setJob({...job, endIndex: e.target.value})}
              >
                <option value="" disabled>-- Select --</option>
                {locations.map((loc, idx) => (
                  <option key={loc.id} value={idx}>{idx}. {loc.address}</option>
                ))}
              </select>

              <br/><br/>
              <button onClick={handleSetEndpoints}>Save Endpoints</button>
            </div>
          )}

          <ul style={{ listStyleType: "none", padding: 0 }}>
            {locations.map((loc, idx) => (
              <li key={loc.id} style={{ marginBottom: "10px", padding: "10px", border: "1px solid #ddd", borderRadius: "5px" }}>
                {editingLocationId === loc.id ? (
                  <div>
                    <input 
                      type="text" 
                      value={editFormData.address} 
                      onChange={e => setEditFormData({...editFormData, address: e.target.value})} 
                      placeholder="Address" 
                      style={{ width: "100%", marginBottom: "5px" }}
                    />
                    {isDelivery && (
                      <input 
                        type="number" 
                        value={editFormData.demand} 
                        onChange={e => setEditFormData({...editFormData, demand: e.target.value})} 
                        placeholder="Demand"
                        style={{ marginRight: "5px", width: "80px" }}
                      />
                    )}
                    <input 
                      type="number" 
                      value={editFormData.timeWindowStart} 
                      onChange={e => setEditFormData({...editFormData, timeWindowStart: e.target.value})} 
                      placeholder="TW Start (s)"
                      style={{ marginRight: "5px", width: "100px" }}
                    />
                    <input 
                      type="number" 
                      value={editFormData.timeWindowEnd} 
                      onChange={e => setEditFormData({...editFormData, timeWindowEnd: e.target.value})} 
                      placeholder="TW End (s)"
                      style={{ width: "100px" }}
                    />
                    <div style={{ marginTop: "10px" }}>
                      <button onClick={() => handleUpdateLocation(loc.id)} style={{ marginRight: "5px" }}>Save</button>
                      <button onClick={() => setEditingLocationId(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <strong>{idx}. {loc.address}</strong>
                    <br />
                    <span style={{ fontSize: "14px", color: "#555" }}>
                      {isDelivery && `Demand: ${loc.demand ?? 0} | `}
                      Time Window: {loc.timeWindowStart ?? 0}s - {loc.timeWindowEnd ?? 86400}s
                    </span>
                    <div style={{ marginTop: "5px" }}>
                      <button onClick={() => handleEditClick(loc)} style={{ marginRight: "5px", padding: "2px 8px", fontSize: "12px" }}>Edit</button>
                      <button onClick={() => handleDeleteLocation(loc.id)} style={{ color: "red", padding: "2px 8px", fontSize: "12px" }}>Delete</button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
          
          <hr />
          <button 
            onClick={handleOptimize} 
            disabled={loading || locations.length < 2}
            style={{ padding: "15px", fontSize: "16px", width: "100%", background: "#4CAF50", color: "white" }}
          >
            {loading ? "Optimizing..." : "OPTIMIZE ROUTE"}
          </button>

        </div>

        {/* RIGHT PANEL: Map */}
        <div style={{ flex: 1 }}>
          
          {optimizationResult && (
            <div style={{ marginBottom: "20px", padding: "10px", border: "2px solid green" }}>
              <h3>Optimization Results</h3>
              <p>Total Distance: {optimizationResult.summary?.totalDistanceKm} km</p>
              <p>Total Duration: {optimizationResult.summary?.totalDurationMinutes} mins</p>
              
              {optimizationResult.routes?.map(r => (
                <div key={r.vehicleIndex} style={{ margin: "10px 0", padding: "10px", background: "#f9f9f9" }}>
                  {isDelivery && <h4>Vehicle {r.vehicleIndex + 1}</h4>}
                  <ol>
                      {r.stops?.map((stop, idx) => (
                        <li key={idx}>
                          {stop.address}
                          {idx > 0 && stop.distanceFromPreviousKm > 0 && (
                            <span style={{ fontSize: "0.85em", color: "#666", marginLeft: "8px" }}>
                              (+{stop.distanceFromPreviousKm} km)
                            </span>
                          )}
                        </li>
                      ))}
                  </ol>
                </div>
              ))}
            </div>
          )}

          <h3>Interactive Map</h3>
          <InteractiveMap locations={locations} optimizationResult={optimizationResult} job={job} />
        </div>

      </div>
    </div>
  );
}

import { useState } from "react";
import axiosClient from "../api/axiosClient";

export default function CreateJobForm({ onJobCreated }) {
  const [jobName, setJobName] = useState("");
  const [routeType, setRouteType] = useState("DELIVERY");
  const [vehicleCount, setVehicleCount] = useState(1);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // Build the payload dynamically based on routeType
      const payload = {
        jobName,
        routeType,
      };

      // Only attach vehicleCount if it's a Delivery job
      if (routeType === "DELIVERY") {
        payload.vehicleCount = parseInt(vehicleCount, 10);
      }

      const res = await axiosClient.post("/optimization", payload);
      
      // Notify the parent Dashboard that a job was created!
      onJobCreated(res.data.job);
      
      // Reset form
      setJobName("");
      setRouteType("DELIVERY");
      setVehicleCount(1);
    } catch (err) {
      const errorData = err.response?.data?.error;
      
      if (Array.isArray(errorData) && errorData.length > 0) {
        setError(errorData[0].message);
      } else if (errorData && typeof errorData === 'object') {
        if (errorData.issues && errorData.issues.length > 0) {
          setError(errorData.issues[0].message);
        } else {
          setError(errorData.message || JSON.stringify(errorData));
        }
      } else {
        setError(errorData || "Failed to create job");
      }
    }
  };

  return (
    <div style={{ border: "1px solid black", padding: "10px", marginBottom: "20px" }}>
      <h2>Create New Optimization Job</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      
      <form onSubmit={handleSubmit}>
        <div>
          <label>Job Name: </label>
          <input 
            type="text" 
            value={jobName} 
            onChange={(e) => setJobName(e.target.value)} 
            required 
          />
        </div>

        <div style={{ margin: "10px 0" }}>
          <label>Route Type: </label>
          <select value={routeType} onChange={(e) => setRouteType(e.target.value)}>
            <option value="DELIVERY">Delivery Logistics</option>
            <option value="TRIP_PLANNER">Trip Planner (Tourism)</option>
          </select>
        </div>

        {/* Dynamic Field: Only show Vehicle Count if they chose DELIVERY */}
        {routeType === "DELIVERY" && (
          <div>
            <label>Number of Vehicles: </label>
            <input 
              type="number" 
              min="1" 
              value={vehicleCount} 
              onChange={(e) => setVehicleCount(e.target.value)} 
              required 
            />
          </div>
        )}

        <button type="submit" style={{ marginTop: "10px" }}>Create Job</button>
      </form>
    </div>
  );
}

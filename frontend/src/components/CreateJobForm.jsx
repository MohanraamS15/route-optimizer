import { useState } from "react";
import axiosClient from "../api/axiosClient";
import { parseError } from "../utils/errorHandler";

export default function CreateJobForm({ onJobCreated }) {
  const [jobName, setJobName] = useState("");
  const [routeType, setRouteType] = useState("DELIVERY");
  const [vehicleCount, setVehicleCount] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = { jobName, routeType };
      if (routeType === "DELIVERY") payload.vehicleCount = parseInt(vehicleCount, 10);
      const res = await axiosClient.post("/optimization", payload);
      onJobCreated(res.data.job);
      setJobName("");
      setRouteType("DELIVERY");
      setVehicleCount(1);
    } catch (err) {
      setError(parseError(err, "Failed to create job"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="mb-2">New Routing Job</h2>
      {error && <p className="text-error">{error}</p>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Job Name</label>
          <input
            type="text"
            className="form-input"
            value={jobName}
            onChange={(e) => setJobName(e.target.value)}
            placeholder="e.g. Morning Deliveries"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Route Type</label>
          <select
            className="form-select"
            value={routeType}
            onChange={(e) => setRouteType(e.target.value)}
          >
            <option value="DELIVERY">Delivery Logistics (CVRP)</option>
            <option value="TRIP_PLANNER">Trip Planner (TSP)</option>
          </select>
        </div>

        {routeType === "DELIVERY" && (
          <div className="form-group">
            <label className="form-label">Number of Vehicles</label>
            <input
              type="number"
              className="form-input"
              min="1"
              value={vehicleCount}
              onChange={(e) => setVehicleCount(e.target.value)}
              required
            />
          </div>
        )}

        <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
          {loading ? "Creating..." : "Create Job"}
        </button>
      </form>
    </div>
  );
}

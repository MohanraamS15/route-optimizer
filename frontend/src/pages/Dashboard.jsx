import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { parseError } from "../utils/errorHandler";
import CreateJobForm from "../components/CreateJobForm";

export default function Dashboard() {
  const { user, logout } = useContext(AuthContext);
  const [jobs, setJobs] = useState([]);
  const navigate = useNavigate();

  // Fetch jobs when the dashboard loads
  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await axiosClient.get("/optimization");
      setJobs(res.data.jobs || []);
    } catch (err) {
      console.error("Failed to fetch jobs");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Called by CreateJobForm when it successfully creates a job
  const handleJobCreated = (newJob) => {
    // Add the new job to the top of our list
    setJobs([newJob, ...jobs]);
  };

  const deleteJob = async (jobId) => {
    try {
      await axiosClient.delete(`/optimization/${jobId}`);
      // Remove it from the screen
      setJobs(jobs.filter(job => job.id !== jobId));
    } catch (err) {
      alert("Failed to delete job: " + parseError(err));
    }
  };

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {user?.name}!</p>
      <button onClick={handleLogout}>Logout</button>
      
      <hr />
      
      {/* 1. The Job Creation Form */}
      <CreateJobForm onJobCreated={handleJobCreated} />

      {/* 2. The Job List */}
      <h3>Your Optimization Jobs ({jobs.length})</h3>
      
      {jobs.length === 0 ? (
        <p>No jobs found. Create one above!</p>
      ) : (
        <ul>
          {jobs.map((job) => (
            <li key={job.id} style={{ marginBottom: "15px" }}>
              <strong>{job.jobName}</strong> - <em>{job.routeType}</em> 
              <br />
              Status: {job.status} 
              {job.routeType === "DELIVERY" && ` | Vehicles: ${job.vehicleCount}`}
              <br />
              
              <Link to={`/job/${job.id}`}>
                <button style={{ marginRight: "10px" }}>Open Workspace</button>
              </Link>
              
              <button onClick={() => deleteJob(job.id)} style={{ color: "red" }}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

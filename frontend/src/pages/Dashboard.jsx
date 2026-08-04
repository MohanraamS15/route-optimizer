import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { parseError } from "../utils/errorHandler";
import CreateJobForm from "../components/CreateJobForm";
import { useToast } from "../context/ToastContext";

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const toast = useToast();
  const [jobs, setJobs] = useState([]);

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

  const handleJobCreated = (newJob) => {
    setJobs([newJob, ...jobs]);
  };

  const deleteJob = async (jobId) => {
    if (!window.confirm("Delete this job?")) return;
    try {
      await axiosClient.delete(`/optimization/${jobId}`);
      setJobs(jobs.filter(job => job.id !== jobId));
      toast("Job deleted.", "info");
    } catch (err) {
      toast("Failed to delete job: " + parseError(err), "error");
    }
  };

  // map status → badge CSS class
  const statusClass = (status) => {
    switch (status) {
      case 'DRAFT':       return 'badge-draft';
      case 'PROCESSING':  return 'badge-processing';
      case 'OPTIMIZED':
      case 'COMPLETED':   return 'badge-optimized';
      default:            return '';
    }
  };

  return (
    <div className="container">
      {/* Page header */}
      <div className="mb-4">
        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>Dashboard</p>
        <h1 style={{ fontSize: 'clamp(1.75rem, 5vw, 3rem)', fontWeight: 700, marginBottom: 0, lineHeight: 1.1 }}>
          Welcome back, <span style={{ color: 'var(--color-primary)' }}>{user?.name}</span>.
        </h1>
      </div>

      {/* ── Create form — full width on top ── */}
      <div className="mb-4">
        <CreateJobForm onJobCreated={handleJobCreated} />
      </div>

      {/* ── Jobs list — horizontal grid below ── */}
      <div>
        <div className="flex-row-mobile-col mb-2">
          <h2 style={{ marginBottom: 0 }}>Your Optimization Jobs</h2>
          <span className="badge">{jobs.length} total</span>
        </div>

        {jobs.length === 0 ? (
          <div
            className="card text-center"
            style={{ padding: '3rem 1.5rem', borderStyle: 'dashed', boxShadow: 'none' }}
          >
            <p style={{ marginBottom: 0 }}>No jobs yet. Create one above to get started.</p>
          </div>
        ) : (
          /* auto-fill: 1 col mobile → 2 col tablet → 3 col laptop */
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '1rem',
          }}>
            {jobs.map((job) => (
              <div key={job.id} className="job-card">
                {/* Title row */}
                <div className="flex items-start justify-between mb-1">
                  <h3 style={{ marginBottom: 0, marginRight: '0.5rem' }}>{job.jobName}</h3>
                  <span className={`badge ${statusClass(job.status)}`}>
                    {job.status}
                  </span>
                </div>

                {/* Meta */}
                <p className="text-sm" style={{ marginBottom: '1rem' }}>
                  <strong>{job.routeType}</strong>
                  {job.routeType === "DELIVERY" && ` • ${job.vehicleCount} vehicles`}
                </p>

                {/* Actions */}
                <div className="flex gap-2 flex-wrap">
                  <Link to={`/job/${job.id}`} className="btn btn-outline btn-sm">
                    Open Workspace
                  </Link>
                  <button onClick={() => deleteJob(job.id)} className="btn btn-danger">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

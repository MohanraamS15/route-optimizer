import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { parseError } from "../utils/errorHandler";
import InteractiveMap from "../components/InteractiveMap";
import { useToast } from "../context/ToastContext";
import TimePicker from "../components/TimePicker";
import { secondsToTimeStr, timeStrToSeconds, secondsToDisplay } from "../utils/timeUtils";

export default function JobWorkspace() {
  const { id } = useParams();
  const toast = useToast();

  const [job, setJob] = useState(null);
  const [locations, setLocations] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [savingVehicles, setSavingVehicles] = useState(false);

  const [address, setAddress] = useState("");
  const [demand, setDemand] = useState(0);
  // time stored as "HH:MM" strings; converted to seconds on submit
  const [twStart, setTwStart] = useState("");
  const [twEnd, setTwEnd] = useState("");
  const [twError, setTwError] = useState(""); // inline validation error
  const [addingLocation, setAddingLocation] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState(null);

  const [editingLocationId, setEditingLocationId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [confirmState, setConfirmState] = useState(null);

  /* ── Data fetching ── */
  const fetchJobDetails = async () => {
    try {
      const res = await axiosClient.get(`/optimization/${id}`);
      const fetchedJob = res.data.job || res.data.data;
      setJob(fetchedJob);
      if (fetchedJob.vehicles) setVehicles(fetchedJob.vehicles);
    } catch (err) { console.error("Failed to fetch job", err); }
  };

  const fetchLocations = async () => {
    try {
      const res = await axiosClient.get(`/optimization/${id}/locations`);
      setLocations(res.data.locations || []);
    } catch (err) { console.error("Failed to fetch locations", err); }
  };

  const fetchOptimizationResult = async () => {
    try {
      const res = await axiosClient.get(`/optimization/${id}/result`);
      setOptimizationResult(res.data.data);
    } catch (err) { /* no results yet */ }
  };

  const resetEndpoints = async () => {
    try {
      await axiosClient.patch(`/optimization/${id}`, { startIndex: null, endIndex: null });
      setJob(prev => ({ ...prev, startIndex: null, endIndex: null }));
    } catch (err) { console.error("Failed to reset endpoints", err); }
  };

  useEffect(() => {
    fetchJobDetails();
    fetchLocations();
    fetchOptimizationResult();
  }, [id]);

  const confirm = (message) =>
    new Promise((resolve) => setConfirmState({ message, onConfirm: resolve }));

  /* ── Handlers ── */
  const handleAddLocation = async (e) => {
    e.preventDefault();
    setTwError("");

    // Validate: end must be after start
    if (twStart && twEnd && twEnd <= twStart) {
      setTwError("End time must be later than start time.");
      return;
    }

    setAddingLocation(true);
    try {
      const payload = { address };
      if (job?.routeType === "DELIVERY") payload.demand = parseInt(demand, 10);
      const startSec = timeStrToSeconds(twStart);
      const endSec   = timeStrToSeconds(twEnd);
      if (startSec !== null) payload.timeWindowStart = startSec;
      if (endSec   !== null) payload.timeWindowEnd   = endSec;
      await axiosClient.post(`/optimization/${id}/locations`, { locations: [payload] });
      await resetEndpoints();
      fetchLocations();
      fetchJobDetails();
      setOptimizationResult(null);
      setAddress(""); setDemand(0); setTwStart(""); setTwEnd(""); setTwError("");
      toast("Location added! Set your Start & End locations and click 'Optimize Route'.", "success");
    } catch (err) {
      toast("Failed to add location: " + parseError(err), "error");
    } finally { setAddingLocation(false); }
  };

  const handleEndpointChange = async (type, value) => {
    const val = parseInt(value, 10);
    const newStart = type === "start" ? val : job.startIndex;
    const newEnd   = type === "end"   ? val : job.endIndex;

    setJob(prev => ({ ...prev, startIndex: newStart, endIndex: newEnd }));

    if (newStart !== null && newEnd !== null && !isNaN(newStart) && !isNaN(newEnd)) {
      try {
        await axiosClient.patch(`/optimization/${id}`, {
          startIndex: newStart,
          endIndex: newEnd,
        });
        toast("Endpoints saved automatically! Ready to optimize.", "success", 3000);
        fetchJobDetails();
      } catch (err) {
        toast("Failed to save endpoints: " + parseError(err), "error");
      }
    }
  };

  const handleSetEndpoints = async () => {
    try {
      await axiosClient.patch(`/optimization/${id}`, {
        startIndex: parseInt(job.startIndex, 10),
        endIndex: parseInt(job.endIndex, 10),
      });
      toast("Endpoints saved! Click 'Optimize Route' button at the top to calculate your route.", "success", 5000);
      fetchJobDetails();
    } catch (err) {
      toast("Failed: " + parseError(err), "error");
    }
  };


  const handleOptimize = async () => {
    if (job.startIndex === null || job.endIndex === null) {
      toast("Please set Start and End locations first!", "warning");
      return;
    }
    setOptimizing(true);
    try {
      await axiosClient.post(`/optimization/${id}/optimize`);
      toast("Route optimized successfully! 🎉", "success", 5000);
      fetchJobDetails();
      fetchOptimizationResult();
    } catch (err) {
      toast("Optimization failed: " + parseError(err), "error");
    } finally { setOptimizing(false); }
  };

  const handleVehicleChange = (index, field, value) => {
    const v = [...vehicles];
    v[index] = { ...v[index], [field]: value };
    setVehicles(v);
  };

  const handleSaveVehicles = async () => {
    setSavingVehicles(true);
    try {
      const payload = vehicles.map(v => ({ ...v, capacity: parseInt(v.capacity, 10) || 1 }));
      await axiosClient.put(`/optimization/${id}/vehicles`, { vehicles: payload });
      toast("Vehicles saved!", "success");
    } catch (err) {
      toast("Failed: " + parseError(err), "error");
    } finally { setSavingVehicles(false); }
  };

  const handleDeleteLocation = async (locationId) => {
    const ok = await confirm("Delete this location? This cannot be undone.");
    if (!ok) return;
    try {
      await axiosClient.delete(`/optimization/location/${locationId}`);
      await resetEndpoints();
      fetchLocations();
      fetchJobDetails();
      setOptimizationResult(null);
      toast("Location deleted. Please select Start & End locations and re-optimize.", "info");
    } catch (err) {
      toast("Failed: " + parseError(err), "error");
    }
  };

  const handleEditClick = (loc) => {
    setEditingLocationId(loc.id);
    setEditFormData({
      address: loc.address,
      demand: loc.demand ?? 0,
      // convert stored seconds → "HH:MM" for the time input
      timeWindowStart: secondsToTimeStr(loc.timeWindowStart),
      timeWindowEnd:   secondsToTimeStr(loc.timeWindowEnd),
    });
  };

  const handleUpdateLocation = async (locationId) => {
    // Validate: end must be after start
    const s = editFormData.timeWindowStart;
    const en = editFormData.timeWindowEnd;
    if (s && en && en <= s) {
      toast("End time must be later than start time.", "error");
      return;
    }
    try {
      const payload = { address: editFormData.address };
      if (job?.routeType === "DELIVERY") payload.demand = parseInt(editFormData.demand, 10) || 0;
      // convert "HH:MM" → seconds before sending
      payload.timeWindowStart = timeStrToSeconds(editFormData.timeWindowStart);
      payload.timeWindowEnd   = timeStrToSeconds(editFormData.timeWindowEnd);
      await axiosClient.patch(`/optimization/location/${locationId}`, payload);
      setEditingLocationId(null);
      await resetEndpoints();
      fetchLocations();
      toast("Location updated!", "success");
    } catch (err) {
      toast("Failed: " + parseError(err), "error");
    }
  };

  if (!job) return <div className="container mt-4"><p>Loading Workspace...</p></div>;

  const isDelivery = job.routeType === "DELIVERY";

  const statusColor  = (s) => s === 'DRAFT' ? '#475569' : s === 'PROCESSING' ? '#b45309' : 'var(--color-primary)';
  const statusBg     = (s) => s === 'DRAFT' ? '#f1f5f9' : s === 'PROCESSING' ? '#fffbeb' : '#f0fdfa';
  const statusBorder = (s) => s === 'DRAFT' ? '#94a3b8' : s === 'PROCESSING' ? '#fbbf24' : '#2dd4bf';

  return (
    <div className="container">

      {/* Confirm dialog */}
      {confirmState && (
        <ConfirmDialog
          message={confirmState.message}
          onConfirm={() => { confirmState.onConfirm(true);  setConfirmState(null); }}
          onCancel={() =>  { confirmState.onConfirm(false); setConfirmState(null); }}
        />
      )}

      {/* ── Back ── */}
      <div className="mb-2">
        <Link to="/dashboard" className="btn btn-outline btn-sm">← Back to Dashboard</Link>
      </div>

      {/* ── Header ── */}
      <div className="workspace-header mb-4">
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>Workspace: {job.jobName}</h1>
          <p style={{ marginBottom: 0, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            Mode: <strong>{job.routeType}</strong>
            {isDelivery && ` • ${job.vehicleCount} vehicles`}
            <span style={{
              display: 'inline-block', padding: '0.15rem 0.65rem',
              borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.05em',
              background: statusBg(job.status), border: `1px solid ${statusBorder(job.status)}`,
              color: statusColor(job.status),
            }}>
              {job.status}
            </span>
          </p>
        </div>
        <button
          onClick={handleOptimize}
          disabled={optimizing || addingLocation || locations.length < 2}
          className="btn btn-primary"
          style={{ minWidth: '160px' }}
        >
          {optimizing ? "Optimizing..." : "Optimize Route"}
        </button>
      </div>

      {/* ══════════════════════════════════════
          ROW 1: Add Location form + Vehicles
          (side by side on tablet+, stacked on mobile)
      ══════════════════════════════════════ */}
      <div className="grid-2 mb-4">

        {/* Add Location */}
        <div className="card">
          <h3 className="mb-2">Add Location</h3>
          <form onSubmit={handleAddLocation}>
            <div className="form-group">
              <label className="form-label">Address</label>
              <input type="text" className="form-input" value={address}
                onChange={(e) => setAddress(e.target.value)} required
                placeholder="e.g. Marina Beach, Chennai" />
            </div>

            {isDelivery && (
              <div className="form-group">
                <label className="form-label">Demand (packages)</label>
                <input type="number" className="form-input" min="0" value={demand}
                  onChange={(e) => setDemand(e.target.value)} placeholder="0" />
              </div>
            )}

            <div className="grid-2" style={{ gap: '0.75rem' }}>
              <TimePicker
                label="Time Window Start"
                value={twStart}
                onChange={(v) => { setTwStart(v); setTwError(""); }}
                placeholder="e.g. 9:00 AM"
                hasError={!!twError}
              />
              <TimePicker
                label="Time Window End"
                value={twEnd}
                onChange={(v) => { setTwEnd(v); setTwError(""); }}
                placeholder="e.g. 5:00 PM"
                hasError={!!twError}
              />
            </div>

            {/* Inline validation error */}
            {twError && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                marginTop: '0.5rem',
                padding: '0.5rem 0.75rem',
                background: '#fff1f2',
                border: '1px solid #fca5a5',
                borderRadius: '8px',
                color: '#dc2626',
                fontSize: '0.8rem',
                fontWeight: 500,
              }}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                {twError}
              </div>
            )}

            <button type="submit" disabled={addingLocation || optimizing} className="btn btn-primary btn-full mt-2">
              {addingLocation ? "Adding..." : "+ Add Location"}
            </button>
          </form>
        </div>

        {/* Vehicles config OR Set Endpoints */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Vehicles */}
          {isDelivery && vehicles.length > 0 && (
            <div className="card">
              <h3 className="mb-2">Configure Vehicles</h3>
              {vehicles.map((v, i) => (
                <div key={v.id} className="flex gap-2 mb-2 items-center">
                  <input type="text" className="form-input" value={v.name}
                    onChange={(e) => handleVehicleChange(i, "name", e.target.value)}
                    placeholder={`Vehicle ${i + 1}`} />
                  <input type="number" className="form-input" min="1" value={v.capacity}
                    onChange={(e) => handleVehicleChange(i, "capacity", e.target.value)}
                    placeholder="Cap" style={{ maxWidth: '90px' }} />
                </div>
              ))}
              <button onClick={handleSaveVehicles} disabled={savingVehicles}
                className="btn btn-outline btn-full btn-sm mt-1">
                {savingVehicles ? "Saving..." : "Save Vehicles"}
              </button>
            </div>
          )}

          {/* Set Endpoints */}
          {locations.length >= 2 && (
            <div className="card">
              <h3 className="mb-2">Set Endpoints</h3>
              <div className="form-group mb-2">
                <label className="form-label">Start Location</label>
                <select className="form-select" value={job.startIndex ?? ""}
                  onChange={(e) => handleEndpointChange("start", e.target.value)}>
                  <option value="" disabled>-- Select --</option>
                  {locations.map((loc, idx) => (
                    <option key={loc.id} value={idx}>{idx}. {loc.address}</option>
                  ))}
                </select>
              </div>
              <div className="form-group mb-2">
                <label className="form-label">End Location</label>
                <select className="form-select" value={job.endIndex ?? ""}
                  onChange={(e) => handleEndpointChange("end", e.target.value)}>
                  <option value="" disabled>-- Select --</option>
                  {locations.map((loc, idx) => (
                    <option key={loc.id} value={idx}>{idx}. {loc.address}</option>
                  ))}
                </select>
              </div>
              <button onClick={handleSetEndpoints} className="btn btn-outline btn-full btn-sm">
                Save Endpoints
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════
          ROW 2: Locations — horizontal card grid
      ══════════════════════════════════════ */}
      {locations.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 style={{ marginBottom: 0 }}>Locations</h2>
            <span className="badge">{locations.length} stops</span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '1rem',
          }}>
            {locations.map((loc, idx) => {
              const isStart = String(job.startIndex) === String(idx);
              const isEnd   = String(job.endIndex)   === String(idx);
              return (
                <div key={loc.id} className="card" style={{
                  borderLeft: isStart ? '4px solid #22c55e' : isEnd ? '4px solid #ef4444' : '4px solid transparent',
                  padding: '1rem',
                }}>
                  {editingLocationId === loc.id ? (
                    /* ── Edit mode ── */
                    <div>
                      <input type="text" className="form-input mb-1"
                        value={editFormData.address}
                        onChange={e => setEditFormData({ ...editFormData, address: e.target.value })}
                        placeholder="Address" />
                      {isDelivery && (
                        <input type="number" className="form-input mb-1"
                          value={editFormData.demand}
                          onChange={e => setEditFormData({ ...editFormData, demand: e.target.value })}
                          placeholder="Demand" />
                      )}
                      <div className="flex gap-2 mb-2">
                        <TimePicker
                          value={editFormData.timeWindowStart}
                          onChange={v => setEditFormData({ ...editFormData, timeWindowStart: v })}
                          placeholder="Start time"
                        />
                        <TimePicker
                          value={editFormData.timeWindowEnd}
                          onChange={v => setEditFormData({ ...editFormData, timeWindowEnd: v })}
                          placeholder="End time"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleUpdateLocation(loc.id)} className="btn btn-primary btn-sm">Save</button>
                        <button onClick={() => setEditingLocationId(null)} className="btn btn-outline btn-sm">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    /* ── View mode ── */
                    <>
                      {/* Stop number + role badge */}
                      <div className="flex items-start justify-between mb-1">
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Stop {idx}
                        </span>
                        {(isStart || isEnd) && (
                          <span style={{
                            fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
                            padding: '0.1rem 0.5rem', borderRadius: '9999px',
                            background: isStart && isEnd ? '#f0fdf4' : isStart ? '#f0fdf4' : '#fff1f2',
                            color: isStart ? '#16a34a' : '#dc2626',
                            border: `1px solid ${isStart ? '#86efac' : '#fca5a5'}`,
                          }}>
                            {isStart && isEnd ? 'Start & End' : isStart ? 'Start' : 'End'}
                          </span>
                        )}
                      </div>

                      {/* Address */}
                      <p style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '0.9rem', marginBottom: '0.4rem' }}>
                        {loc.address}
                      </p>

                      {/* Time window — shown as AM/PM */}
                      <p className="text-xs" style={{ color: 'var(--color-text-light)', marginBottom: '0.75rem' }}>
                        {isDelivery && `Demand: ${loc.demand ?? 0} pkgs  •  `}
                        🕐 {secondsToDisplay(loc.timeWindowStart)} – {secondsToDisplay(loc.timeWindowEnd)}
                      </p>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button onClick={() => handleEditClick(loc)} className="btn btn-outline btn-sm" style={{ flex: 1 }}>Edit</button>
                        <button onClick={() => handleDeleteLocation(loc.id)} className="btn btn-danger btn-sm">Delete</button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          ROW 3: Optimization Results (full width)
      ══════════════════════════════════════ */}
      {optimizationResult ? (
        <div className="card mb-4">
          <h2 className="mb-3">Routing Results</h2>

          {/* Route Disclaimer — shown if stops were omitted or time windows exceeded */}
          {(optimizationResult.summary?.hasConstraintWarning || (optimizationResult.summary?.skippedLocations && optimizationResult.summary?.skippedLocations.length > 0)) && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              background: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: '10px',
              padding: '0.875rem 1rem',
              marginBottom: '1.25rem',
              color: '#92400e',
            }}>
              <span style={{ flexShrink: 0, marginTop: '2px', color: '#d97706' }}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </span>
              <div style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
                <strong>Route Disclaimer:</strong>
                {optimizationResult.summary?.skippedLocations?.length > 0 ? (
                  <div style={{ marginTop: '0.25rem' }}>
                    The following location(s) could not be reached within their specified time window from the Start location and were omitted from the route:
                    <ul style={{ margin: '0.25rem 0 0 1.25rem', padding: 0 }}>
                      {optimizationResult.summary.skippedLocations.map((loc, i) => (
                        <li key={i}>
                          <strong style={{ textTransform: 'capitalize' }}>{loc.address}</strong>
                          {loc.timeWindowStart !== null && loc.timeWindowEnd !== null && (
                            <span> (Time Window: {secondsToDisplay(loc.timeWindowStart)} – {secondsToDisplay(loc.timeWindowEnd)})</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <span> Travel time between certain locations exceeds narrow time window targets. The optimal route for reachable locations is displayed below.</span>
                )}
              </div>
            </div>
          )}

          {/* Summary stats */}
          <div className="flex gap-4 mb-3 flex-wrap">
            <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0.75rem 1.25rem' }}>
              <p className="text-xs" style={{ color: 'var(--color-text-light)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Total Distance</p>
              <strong style={{ fontSize: '1.25rem' }}>{optimizationResult.summary?.totalDistanceKm} km</strong>
            </div>
            <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0.75rem 1.25rem' }}>
              <p className="text-xs" style={{ color: 'var(--color-text-light)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Total Duration</p>
              <strong style={{ fontSize: '1.25rem' }}>{optimizationResult.summary?.totalDurationMinutes} mins</strong>
            </div>
          </div>

          {/* Route paths */}
          {optimizationResult.routes?.map(r => (
            <div key={r.vehicleIndex} className="mb-3">
              {isDelivery && (
                <p style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem' }}>Vehicle {r.vehicleIndex + 1}</p>
              )}
              <div className="route-path">
                {r.stops?.map((stop, idx) => (
                  <span key={idx}>
                    <span className="route-stop">{stop.address}</span>
                    {idx > 0 && stop.distanceFromPreviousKm > 0 && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-text-light)', marginLeft: '4px' }}>
                        (+{stop.distanceFromPreviousKm}km)
                      </span>
                    )}
                    {idx < r.stops.length - 1 && <span className="route-arrow">➔</span>}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ── No results yet — show a helpful status card ── */
        <div className="card mb-4" style={{
          borderStyle: 'dashed',
          boxShadow: 'none',
          background: 'var(--color-bg)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            {/* Icon */}
            <span style={{
              width: '44px', height: '44px', flexShrink: 0, borderRadius: '10px',
              background: '#f0fdfa', border: '1px solid #2dd4bf',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24"
                stroke="#0d9488" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
              </svg>
            </span>

            <div style={{ flex: 1 }}>
              <h3 style={{ marginBottom: '0.25rem' }}>No Optimized Route Yet</h3>

              {/* Checklist of what's needed */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.75rem' }}>
                {[
                  { done: locations.length >= 2, label: `At least 2 locations added (${locations.length} added)` },
                  { done: job.startIndex !== null && job.startIndex !== undefined && job.startIndex !== '', label: 'Start location set' },
                  { done: job.endIndex !== null && job.endIndex !== undefined && job.endIndex !== '', label: 'End location set' },
                ].map((step, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                    <span style={{
                      width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: step.done ? '#dcfce7' : '#f1f5f9',
                      border: `1px solid ${step.done ? '#86efac' : '#cbd5e1'}`,
                    }}>
                      {step.done ? (
                        <svg width="11" height="11" fill="none" viewBox="0 0 24 24"
                          stroke="#16a34a" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      ) : (
                        <svg width="11" height="11" fill="none" viewBox="0 0 24 24"
                          stroke="#94a3b8" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5" />
                        </svg>
                      )}
                    </span>
                    <span style={{ color: step.done ? 'var(--color-text)' : 'var(--color-text-light)' }}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA hint */}
              {locations.length >= 2 &&
               job.startIndex !== null && job.startIndex !== '' &&
               job.endIndex !== null && job.endIndex !== '' && (
                <p style={{ marginTop: '1rem', marginBottom: 0, fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                  ✓ All set! Click <strong>Optimize Route</strong> at the top to generate results.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          ROW 4: Map (full width)
      ══════════════════════════════════════ */}
      <div className="map-wrapper">
        <InteractiveMap locations={locations} optimizationResult={optimizationResult} job={job} />
      </div>

      <div style={{ height: '2rem' }} />
    </div>
  );
}

/* ── Confirm Dialog ── */
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9998,
      background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div style={{
        background: '#fff', borderRadius: '16px', padding: '2rem 1.75rem',
        maxWidth: '400px', width: '100%',
        boxShadow: '0 25px 50px rgba(0,0,0,0.25)', animation: 'toastIn 0.25s ease',
      }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <span style={{ color: '#f59e0b', flexShrink: 0, marginTop: '2px' }}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </span>
          <p style={{ margin: 0, fontWeight: 500, color: '#0f172a', lineHeight: 1.5 }}>{message}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} className="btn btn-outline btn-sm">Cancel</button>
          <button onClick={onConfirm} className="btn btn-sm"
            style={{ background: '#ef4444', color: 'white', borderColor: '#ef4444' }}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

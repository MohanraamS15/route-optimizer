import { useParams, Link } from "react-router-dom";

export default function JobWorkspace() {
  const { id } = useParams();

  return (
    <div>
      <Link to="/dashboard">← Back to Dashboard</Link>
      
      <h1>Workspace for Job #{id}</h1>
      <p>(We will build the Split-Screen Map and Location Manager here in Steps 3 and 4)</p>
    </div>
  );
}

import { useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import JobWorkspace from "./pages/JobWorkspace";

const ProtectedRoute = ({ children }) => {
  const { token, loading } = useContext(AuthContext);
  if (loading) return <div className="container mt-4">Loading...</div>;
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

const Navigation = () => {
  const { token, logout } = useContext(AuthContext);
  return (
    <nav className="navbar">
      <div className="container navbar-content">
        <Link to="/" className="navbar-brand">Route Optimizer.</Link>
        <div className="navbar-links">
          {token ? (
            <>
              <Link to="/dashboard" className="navbar-link">Dashboard</Link>
              <button onClick={logout} className="btn btn-outline" style={{ padding: '0.25rem 0.75rem', minHeight: 'auto' }}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar-link">Login</Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: '0.35rem 0.9rem', minHeight: 'auto' }}>Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default function App() {
  const { loading } = useContext(AuthContext);
  if (loading) return <div className="container mt-4">Loading...</div>;

  return (
    <BrowserRouter>
      <ToastProvider>
        <Navigation />
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/job/:id" element={<ProtectedRoute><JobWorkspace /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}

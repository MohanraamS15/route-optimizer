import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import axiosClient from "../api/axiosClient";
import { useNavigate, Link } from "react-router-dom";
import { parseError } from "../utils/errorHandler";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    try {
      const response = await axiosClient.post("/auth/login", { email, password });
      login(response.data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(parseError(err, "Login failed"));
    }
  };

  return (
    <div className="container auth-container">
      <div className="auth-card card">
        <h2 className="text-center mb-4">Login</h2>
        {error && <p className="text-error text-center mb-2">{error}</p>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input 
              type="email" 
              className="form-input"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group mb-4">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-input"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          <button type="submit" className="btn btn-primary btn-full mb-4">Login</button>
        </form>
        
        <p className="text-center">
          Don't have an account? <Link to="/register" style={{color: 'var(--color-primary)'}}>Register</Link>
        </p>
      </div>
    </div>
  );
}

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
      // The backend returns { token: "..." }
      login(response.data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(parseError(err, "Login failed"));
    }
  };

  return (
    <div>
      <h1>Login to Route Optimizer</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email: </label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
        </div>
        <div>
          <label>Password: </label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
        </div>
        <button type="submit">Login</button>
      </form>
      
      <p>
        Don't have an account? <Link to="/register">Register here</Link>
      </p>
    </div>
  );
}

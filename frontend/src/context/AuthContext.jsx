import { createContext, useState, useEffect } from "react";
import axiosClient from "../api/axiosClient";

// 1. Create a Context to share Auth state across the whole app
export const AuthContext = createContext();

// 2. Create a Provider component that wraps our app
export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 3. Whenever the token changes, update localStorage and fetch the user profile
  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
      
      // We ping the backend to verify the token and get the user's name
      axiosClient.get("/auth/me")
        .then((res) => {
          setUser(res.data.user);
        })
        .catch(() => {
          // If token is invalid/expired, log them out
          logout();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      localStorage.removeItem("token");
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  const login = (newToken) => {
    setToken(newToken);
  };

  const logout = () => {
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

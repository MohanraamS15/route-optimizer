import axios from "axios";

// Create a centralized Axios instance
const axiosClient = axios.create({
  // Point to our Node.js backend using env variable, fallback to localhost
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000",
});

// INTERCEPTOR: Every time we make an API request, this function runs FIRST.
axiosClient.interceptors.request.use((config) => {
  // We grab the JWT token from the browser's localStorage
  const token = localStorage.getItem("token");

  // If a token exists, we attach it to the headers like this: "Bearer eyJhb..."
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default axiosClient;

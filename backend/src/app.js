import authRoutes from "./auth/auth.routes.js";
import optimizationRoutes from "./optimization/optimization.routes.js";
import express from "express";

const app = express();

app.use(express.json());

app.use("/auth", authRoutes);
app.use("/optimization", optimizationRoutes);

export default app;
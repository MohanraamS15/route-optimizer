import authRoutes from "./auth/auth.routes.js";
import express from "express";

const app = express();

app.use(express.json());

app.use("/auth", authRoutes);

export default app;
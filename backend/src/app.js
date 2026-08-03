import express from "express";
import cors from "cors";
import authRoutes from "./auth/auth.routes.js";
import optimizationRoutes from "./optimization/optimization.routes.js";
import locationRoutes from "./location/location.routes.js";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";

const app = express();

app.use(cors());
app.use(express.json());

// Load Swagger document
const swaggerDocument = YAML.load(path.join(process.cwd(), "swagger.yaml"));

// Setup Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use("/auth", authRoutes);
app.use("/optimization", optimizationRoutes);
app.use("/locations", locationRoutes);

export default app;
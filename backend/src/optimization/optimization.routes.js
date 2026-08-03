import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { create, getAll, getSingle, remove, update, optimize, getResult, updateVehicles } from "./optimization.controller.js";

const router = Router();

// Apply authentication middleware to all optimization routes
router.use(authenticate);

router.post("/", create);
router.get("/", getAll);
router.get("/:id", getSingle);
router.patch("/:id", update);
router.put("/:id/vehicles", updateVehicles);
router.delete("/:id", remove);
router.post("/:id/optimize", optimize);
router.get("/:id/result", getResult);

export default router;

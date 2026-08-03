import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { addLocations, getLocations, updateLocation, deleteLocation } from "./location.controller.js";

const router = Router();

router.use(authenticate);

// Mount under /optimization in app.js so it becomes /optimization/:jobId/locations
router.post("/:jobId/locations", addLocations);
router.get("/:jobId/locations", getLocations);

// Specific location updates
router.patch("/location/:locationId", updateLocation);
router.delete("/location/:locationId", deleteLocation);

export default router;

import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { addLocations, getLocations, updateLocation, deleteLocation } from "./location.controller.js";

const router = Router();

router.use(authenticate);

// These will be mounted at /locations in app.js
// If you want them to be strictly /optimization/:jobId/locations,
// we should ideally mount them in optimization.routes.js, but keeping them here per instructions!
router.post("/optimization/:jobId/locations", addLocations);
router.get("/optimization/:jobId/locations", getLocations);
router.patch("/:locationId", updateLocation);
router.delete("/:locationId", deleteLocation);

export default router;

import * as locationService from "./location.service.js";
import { createLocationsSchema, updateLocationSchema } from "./location.validation.js";

const handleErrorResponse = (res, error) => {
  if (error.message === "Job not found" || error.message === "Location not found") {
    return res.status(404).json({ success: false, error: error.message });
  }
  if (error.message.includes("Unauthorized")) {
    return res.status(403).json({ success: false, error: error.message });
  }
  if (error.message === "Address not found." || error.message === "Failed to fetch coordinates from Nominatim.") {
    return res.status(400).json({ success: false, error: error.message });
  }
  if (error.message === "Location already exists in this optimization job.") {
    return res.status(409).json({ success: false, error: error.message });
  }
  
  return res.status(500).json({
    success: false,
    error: error.message,
  });
};

export const addLocations = async (req, res) => {
  try {
    const jobId = parseInt(req.params.jobId, 10);
    const userId = req.user.id;

    if (isNaN(jobId)) {
      return res.status(400).json({ success: false, error: "Invalid job ID format" });
    }

    const validateData = createLocationsSchema.safeParse(req.body);

    if (!validateData.success) {
      return res.status(400).json({
        success: false,
        error: validateData.error,
      });
    }

    const result = await locationService.addLocations(jobId, userId, validateData.data.locations);

    return res.status(201).json({
      success: true,
      message: "Locations added successfully",
      data: result,
    });
  } catch (error) {
    return handleErrorResponse(res, error);
  }
};

export const getLocations = async (req, res) => {
  try {
    const jobId = parseInt(req.params.jobId, 10);
    const userId = req.user.id;

    if (isNaN(jobId)) {
      return res.status(400).json({ success: false, error: "Invalid job ID format" });
    }

    const locations = await locationService.getLocations(jobId, userId);

    return res.status(200).json({
      success: true,
      locations,
    });
  } catch (error) {
    return handleErrorResponse(res, error);
  }
};

export const updateLocation = async (req, res) => {
  try {
    const locationId = parseInt(req.params.locationId, 10);
    const userId = req.user.id;

    if (isNaN(locationId)) {
      return res.status(400).json({ success: false, error: "Invalid location ID format" });
    }

    const validateData = updateLocationSchema.safeParse(req.body);

    if (!validateData.success) {
      return res.status(400).json({
        success: false,
        error: validateData.error,
      });
    }

    const updatedLocation = await locationService.updateLocation(locationId, userId, validateData.data);

    return res.status(200).json({
      success: true,
      message: "Location updated successfully",
      location: updatedLocation,
    });
  } catch (error) {
    return handleErrorResponse(res, error);
  }
};

export const deleteLocation = async (req, res) => {
  try {
    const locationId = parseInt(req.params.locationId, 10);
    const userId = req.user.id;

    if (isNaN(locationId)) {
      return res.status(400).json({ success: false, error: "Invalid location ID format" });
    }

    await locationService.deleteLocation(locationId, userId);

    return res.status(200).json({
      success: true,
      message: "Location deleted successfully",
    });
  } catch (error) {
    return handleErrorResponse(res, error);
  }
};

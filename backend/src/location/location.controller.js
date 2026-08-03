import * as locationService from "./location.service.js";
import { createLocationsSchema, updateLocationSchema } from "./location.validation.js";
import { asyncHandler } from '../utils/asyncHandler.js';

const handleErrorResponse = (error, next) => {
  if (error.message === "Job not found" || error.message === "Location not found") {
    error.statusCode = 404;
  } else if (error.message.includes("Unauthorized")) {
    error.statusCode = 403;
  } else if (error.message === "Address not found." || error.message === "Failed to fetch coordinates from Nominatim.") {
    error.statusCode = 400;
  } else if (error.message === "Location already exists in this optimization job.") {
    error.statusCode = 409;
  }
  return next(error);
};

export const addLocations = asyncHandler(async (req, res, next) => {
  const jobId = parseInt(req.params.jobId, 10);
  const userId = req.user.id;

  if (isNaN(jobId)) {
    return next(Object.assign(new Error("Invalid job ID format"), { statusCode: 400 }));
  }

  const validateData = createLocationsSchema.safeParse(req.body);

  if (!validateData.success) {
    return next(Object.assign(new Error(), { name: 'ZodError', errors: validateData.error.issues, statusCode: 400 }));
  }

  try {
    const result = await locationService.addLocations(jobId, userId, validateData.data.locations);
    return res.status(201).json({
      success: true,
      message: "Locations added successfully",
      data: result,
    });
  } catch (error) {
    return handleErrorResponse(error, next);
  }
});

export const getLocations = asyncHandler(async (req, res, next) => {
  const jobId = parseInt(req.params.jobId, 10);
  const userId = req.user.id;

  if (isNaN(jobId)) {
    return next(Object.assign(new Error("Invalid job ID format"), { statusCode: 400 }));
  }

  try {
    const locations = await locationService.getLocations(jobId, userId);
    return res.status(200).json({
      success: true,
      locations,
    });
  } catch (error) {
    return handleErrorResponse(error, next);
  }
});

export const updateLocation = asyncHandler(async (req, res, next) => {
  const locationId = parseInt(req.params.locationId, 10);
  const userId = req.user.id;

  if (isNaN(locationId)) {
    return next(Object.assign(new Error("Invalid location ID format"), { statusCode: 400 }));
  }

  const validateData = updateLocationSchema.safeParse(req.body);

  if (!validateData.success) {
    return next(Object.assign(new Error(), { name: 'ZodError', errors: validateData.error.issues, statusCode: 400 }));
  }

  try {
    const updatedLocation = await locationService.updateLocation(locationId, userId, validateData.data);
    return res.status(200).json({
      success: true,
      message: "Location updated successfully",
      location: updatedLocation,
    });
  } catch (error) {
    return handleErrorResponse(error, next);
  }
});

export const deleteLocation = asyncHandler(async (req, res, next) => {
  const locationId = parseInt(req.params.locationId, 10);
  const userId = req.user.id;

  if (isNaN(locationId)) {
    return next(Object.assign(new Error("Invalid location ID format"), { statusCode: 400 }));
  }

  try {
    await locationService.deleteLocation(locationId, userId);
    return res.status(200).json({
      success: true,
      message: "Location deleted successfully",
    });
  } catch (error) {
    return handleErrorResponse(error, next);
  }
});

import {
  createJob,
  getUserJobs,
  getJobById,
  deleteJob,
  updateJob,
  optimizeJob,
  getOptimizationResult,
  updateVehicles as updateVehiclesService,
} from "./optimization.service.js";
import {
  createOptimizationJobSchema,
  updateOptimizationJobSchema,
  updateVehiclesSchema,
} from "./optimization.validation.js";
import { asyncHandler } from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';

export const create = asyncHandler(async (req, res, next) => {
  const validateData = createOptimizationJobSchema.safeParse(req.body);

  if (!validateData.success) {
    const err = new AppError("Validation failed", 400);
    err.name = 'ZodError';
    err.errors = validateData.error.issues;
    return next(err);
  }

  const userId = req.user.id;
  const job = await createJob(userId, validateData.data);

  return res.status(201).json({
    success: true,
    message: "Optimization job created successfully",
    job,
  });
});

export const getAll = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;

  const result = await getUserJobs(userId, page, limit);

  return res.status(200).json({
    success: true,
    ...result,
  });
});

export const getSingle = asyncHandler(async (req, res, next) => {
  const jobId = parseInt(req.params.id, 10);
  const userId = req.user.id;

  if (isNaN(jobId)) {
    return next(new AppError("Invalid job ID format", 400));
  }

  try {
    const job = await getJobById(jobId, userId);
    return res.status(200).json({
      success: true,
      job,
    });
  } catch (error) {
    if (error.message === "Job not found") {
      return next(new AppError(error.message, 404));
    } else if (error.message === "Unauthorized to access this job") {
      return next(new AppError(error.message, 403));
    }
    return next(error);
  }
});

export const remove = asyncHandler(async (req, res, next) => {
  const jobId = parseInt(req.params.id, 10);
  const userId = req.user.id;

  if (isNaN(jobId)) {
    return next(new AppError("Invalid job ID format", 400));
  }

  try {
    await deleteJob(jobId, userId);
    return res.status(200).json({
      success: true,
      message: "Optimization job deleted successfully",
    });
  } catch (error) {
    if (error.message === "Job not found") {
      return next(new AppError(error.message, 404));
    } else if (error.message === "Unauthorized to delete this job") {
      return next(new AppError(error.message, 403));
    }
    return next(error);
  }
});

export const update = asyncHandler(async (req, res, next) => {
  const jobId = parseInt(req.params.id, 10);
  const userId = req.user.id;

  if (isNaN(jobId)) {
    return next(new AppError("Invalid job ID format", 400));
  }

  const validateData = updateOptimizationJobSchema.safeParse(req.body);

  if (!validateData.success) {
    const err = new AppError("Validation failed", 400);
    err.name = 'ZodError';
    err.errors = validateData.error.issues;
    return next(err);
  }

  try {
    const updatedJob = await updateJob(jobId, userId, validateData.data);
    return res.status(200).json({
      success: true,
      message: "Optimization job updated successfully",
      job: updatedJob,
    });
  } catch (error) {
    if (
      error.message === "Invalid startIndex" ||
      error.message === "Invalid endIndex" ||
      error.message === "Cannot set start/end location because no locations exist yet"
    ) {
      return next(new AppError(error.message, 400));
    }
    return next(error);
  }
});

export const updateVehicles = asyncHandler(async (req, res, next) => {
  const jobId = parseInt(req.params.id, 10);
  const userId = req.user.id;

  if (isNaN(jobId)) {
    return next(new AppError("Invalid job ID format", 400));
  }

  const validateData = updateVehiclesSchema.safeParse(req.body);

  if (!validateData.success) {
    const err = new AppError("Validation failed", 400);
    err.name = 'ZodError';
    err.errors = validateData.error.issues;
    return next(err);
  }

  try {
    await updateVehiclesService(jobId, userId, validateData.data.vehicles);
    return res.status(200).json({
      success: true,
      message: "Vehicles updated successfully",
    });
  } catch (error) {
    if (error.message === "Job not found") {
      return next(new AppError(error.message, 404));
    } else if (error.message === "Unauthorized to access this job") {
      return next(new AppError(error.message, 403));
    }
    return next(error);
  }
});

export const optimize = asyncHandler(async (req, res, next) => {
  const jobId = parseInt(req.params.id, 10);
  const userId = req.user.id;

  if (isNaN(jobId)) {
    return next(new AppError("Invalid job ID format", 400));
  }

  try {
    await optimizeJob(jobId, userId);
    return res.status(200).json({
      success: true,
      message: "Optimization completed successfully.",
    });
  } catch (error) {
    if (error.message === "Job not found") {
      return next(new AppError(error.message, 404));
    } else if (error.message === "Unauthorized to access this job") {
      return next(new AppError(error.message, 403));
    } else if (
      error.message === "Start and end locations must be selected before optimization." ||
      error.message === "At least two locations are required for optimization."
    ) {
      return next(new AppError(error.message, 400));
    }
    return next(error);
  }
});

export const getResult = asyncHandler(async (req, res, next) => {
  const jobId = parseInt(req.params.id, 10);
  const userId = req.user.id;

  if (isNaN(jobId)) {
    return next(new AppError("Invalid job ID format", 400));
  }

  try {
    const result = await getOptimizationResult(jobId, userId);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error.message === "Job not found") {
      return next(new AppError(error.message, 404));
    } else if (error.message === "Unauthorized to access this job") {
      return next(new AppError(error.message, 403));
    } else if (error.message === "Optimization result is not available yet. Please run optimization first.") {
      return next(new AppError(error.message, 400));
    }
    return next(error);
  }
});
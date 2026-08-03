import { createJob, getUserJobs, getJobById, deleteJob, updateJob } from "./optimization.service.js";
import { createOptimizationJobSchema, updateOptimizationJobSchema } from "./optimization.validation.js";

export const create = async (req, res) => {
  try {
    const validateData = createOptimizationJobSchema.safeParse(req.body);

    if (!validateData.success) {
      return res.status(400).json({
        success: false,
        error: validateData.error,
      });
    }

    const userId = req.user.id;
    const job = await createJob(userId, validateData.data);

    return res.status(201).json({
      success: true,
      message: "Optimization job created successfully",
      job,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const getAll = async (req, res) => {
  try {
    const userId = req.user.id;
    const jobs = await getUserJobs(userId);

    return res.status(200).json({
      success: true,
      jobs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const getSingle = async (req, res) => {
  try {
    const jobId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    if (isNaN(jobId)) {
      return res.status(400).json({ success: false, error: "Invalid job ID format" });
    }

    const job = await getJobById(jobId, userId);

    return res.status(200).json({
      success: true,
      job,
    });
  } catch (error) {
    // If it's our custom errors (Not Found or Unauthorized)
    if (error.message === "Job not found") {
        return res.status(404).json({ success: false, error: error.message });
    }
    if (error.message === "Unauthorized to access this job") {
        return res.status(403).json({ success: false, error: error.message });
    }

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const remove = async (req, res) => {
  try {
    const jobId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    if (isNaN(jobId)) {
        return res.status(400).json({ success: false, error: "Invalid job ID format" });
    }

    await deleteJob(jobId, userId);

    return res.status(200).json({
      success: true,
      message: "Optimization job deleted successfully",
    });
  } catch (error) {
    if (error.message === "Job not found") {
        return res.status(404).json({ success: false, error: error.message });
    }
    if (error.message === "Unauthorized to delete this job") {
        return res.status(403).json({ success: false, error: error.message });
    }

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const update = async (req, res) => {
  try {
    const jobId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    if (isNaN(jobId)) {
      return res.status(400).json({ success: false, error: "Invalid job ID format" });
    }

    const validateData = updateOptimizationJobSchema.safeParse(req.body);

    if (!validateData.success) {
      return res.status(400).json({
        success: false,
        error: validateData.error,
      });
    }

    const updatedJob = await updateJob(jobId, userId, validateData.data);

    return res.status(200).json({
      success: true,
      message: "Optimization job updated successfully",
      job: updatedJob,
    });
  } catch (error) {
    if (error.message === "Job not found") {
      return res.status(404).json({ success: false, error: error.message });
    }
    if (error.message === "Unauthorized to access this job") {
      return res.status(403).json({ success: false, error: error.message });
    }
    if (error.message === "Invalid depotIndex" || error.message === "Cannot set depotIndex because no locations exist yet") {
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

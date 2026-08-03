import prisma from "../config/prisma.js";
import { optimize } from "../utils/optimizerClient.js";

export const createJob = async (userId, data) => {
  const job = await prisma.optimizationJob.create({
    data: {
      jobName: data.jobName,
      vehicleCount: data.vehicleCount,
      status: "DRAFT",
      userId: userId,
    },
  });

  return job;
};

export const getUserJobs = async (userId) => {
  const jobs = await prisma.optimizationJob.findMany({
    where: {
      userId: userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return jobs;
};

export const getJobById = async (jobId, userId) => {
  const job = await prisma.optimizationJob.findUnique({
    where: {
      id: jobId,
    },
  });

  if (!job) {
    throw new Error("Job not found");
  }

  if (job.userId !== userId) {
    throw new Error("Unauthorized to access this job");
  }

  return job;
};

export const deleteJob = async (jobId, userId) => {
  // First get the job to verify ownership
  const job = await prisma.optimizationJob.findUnique({
    where: {
      id: jobId,
    },
  });

  if (!job) {
    throw new Error("Job not found");
  }

  if (job.userId !== userId) {
    throw new Error("Unauthorized to delete this job");
  }

  await prisma.optimizationJob.delete({
    where: {
      id: jobId,
    },
  });

  return true;
};

export const updateJob = async (jobId, userId, data) => {
  const job = await prisma.optimizationJob.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    throw new Error("Job not found");
  }

  if (job.userId !== userId) {
    throw new Error("Unauthorized to access this job");
  }

  if (data.startIndex !== undefined || data.endIndex !== undefined) {
    const locationCount = await prisma.location.count({
      where: { jobId: jobId },
    });

    if (locationCount === 0) {
      throw new Error("Cannot set start/end location because no locations exist yet");
    }

    if (data.startIndex !== undefined && (data.startIndex < 0 || data.startIndex >= locationCount)) {
      throw new Error("Invalid startIndex");
    }

    if (data.endIndex !== undefined && (data.endIndex < 0 || data.endIndex >= locationCount)) {
      throw new Error("Invalid endIndex");
    }
  }

  const updatedJob = await prisma.optimizationJob.update({
    where: { id: jobId },
    data: data,
  });

  return updatedJob;
};

export const optimizeJob = async (jobId, userId) => {
  // ------------------------
  // Verify Job
  // ------------------------

  const job = await prisma.optimizationJob.findUnique({
    where: {
      id: jobId,
    },
  });

  if (!job) {
    throw new Error("Job not found");
  }

  if (job.userId !== userId) {
    throw new Error("Unauthorized to access this job");
  }

  // ------------------------
  // Validate Start & End
  // ------------------------

  if (
    job.startIndex === null ||
    job.endIndex === null
  ) {
    throw new Error("Start and end locations must be selected before optimization.");
  }

  // ------------------------
  // Fetch Locations
  // ------------------------

  const locations = await prisma.location.findMany({
    where: {
      jobId: jobId,
    },
    orderBy: {
      id: "asc",
    },
  });

  if (locations.length < 2) {
    throw new Error("At least two locations are required for optimization.");
  }

  // ------------------------
  // Build FastAPI Payload
  // ------------------------

  const payload = {
    coordinates: locations.map((location) => [
      location.longitude,
      location.latitude,
    ]),

    num_vehicles: job.vehicleCount,

    start_index: job.startIndex,

    end_index: job.endIndex,

    demands: locations.map((location) => location.demand ?? 0),

    // Temporary default capacity
    vehicle_capacities: Array(job.vehicleCount).fill(100),

    // Temporary default time windows (86400 seconds = 24 hours)
    time_windows: locations.map(() => [0, 86400]),
  };

  // ------------------------
  // Call FastAPI
  // ------------------------

  const result = await optimize(payload);

  return result;
};
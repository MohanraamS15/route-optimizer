import prisma from "../config/prisma.js";

export const createJob = async (userId, data) => {
  const job = await prisma.optimizationJob.create({
    data: {
      jobName: data.jobName,
      vehicleCount: data.vehicleCount,
      depotIndex: null,
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

  if (data.depotIndex !== undefined && data.depotIndex !== null) {
    const locationCount = await prisma.location.count({
      where: { jobId: jobId },
    });

    if (locationCount === 0) {
      throw new Error("Cannot set depotIndex because no locations exist yet");
    }
    
    if (data.depotIndex < 0 || data.depotIndex >= locationCount) {
      throw new Error("Invalid depotIndex");
    }
  }

  const updatedJob = await prisma.optimizationJob.update({
    where: { id: jobId },
    data: data,
  });

  return updatedJob;
};

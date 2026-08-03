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

  // ------------------------
  // Persist Routes in DB
  // ------------------------

  // 1. Delete previous routes
  await prisma.route.deleteMany({
    where: { jobId: jobId },
  });

  // 2. Create new route records & RouteStops
  for (const routeData of result.routes) {
    const newRoute = await prisma.route.create({
      data: {
        vehicleIndex: routeData.vehicle_id,
        totalDistance: routeData.distance,
        totalDuration: routeData.duration,
        totalLoad: routeData.load,
        jobId: jobId,
      },
    });

    // Create RouteStop records
    const routeStopsData = routeData.route.map((locationIndex, sequence) => {
      const locationId = locations[locationIndex].id;
      return {
        sequence: sequence,
        routeId: newRoute.id,
        locationId: locationId,
        arrivalTime: null,
      };
    });

    await prisma.routeStop.createMany({
      data: routeStopsData,
    });
  }

  // 3. Update Job Status
  await prisma.optimizationJob.update({
    where: { id: jobId },
    data: { status: "COMPLETED" },
  });

  return { success: true };
};

export const getOptimizationResult = async (jobId, userId) => {
  const job = await prisma.optimizationJob.findUnique({
    where: { id: jobId },
    include: {
      routes: {
        include: {
          stops: {
            orderBy: { sequence: "asc" },
            include: {
              location: true,
            },
          },
        },
        orderBy: { vehicleIndex: "asc" },
      },
    },
  });

  if (!job) {
    throw new Error("Job not found");
  }

  if (job.userId !== userId) {
    throw new Error("Unauthorized to access this job");
  }

  if (job.status !== "COMPLETED") {
    throw new Error("Optimization result is not available yet. Please run optimization first.");
  }

  // Calculate totals across all routes
  let grandTotalDistance = 0;
  let grandTotalDuration = 0;

  const formattedRoutes = job.routes.map((route) => {
    grandTotalDistance += route.totalDistance;
    grandTotalDuration += route.totalDuration;

    return {
      vehicleIndex: route.vehicleIndex,
      // Convert distance to km (meters / 1000)
      distanceKm: Number((route.totalDistance / 1000).toFixed(2)),
      // Convert duration to minutes (seconds / 60)
      durationMinutes: Number((route.totalDuration / 60).toFixed(2)),
      load: route.totalLoad,
      stops: route.stops.map((stop) => ({
        sequence: stop.sequence + 1, // 1-indexed for users
        address: stop.location.address,
        latitude: stop.location.latitude,
        longitude: stop.location.longitude,
        demand: stop.location.demand ?? 0,
      })),
    };
  });

  return {
    jobId: job.id,
    jobName: job.jobName,
    status: job.status,
    summary: {
      totalDistanceKm: Number((grandTotalDistance / 1000).toFixed(2)),
      totalDurationMinutes: Number((grandTotalDuration / 60).toFixed(2)),
    },
    routes: formattedRoutes,
  };
};
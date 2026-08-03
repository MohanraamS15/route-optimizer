import prisma from "../config/prisma.js";
import { optimize } from "../utils/optimizerClient.js";

export const createJob = async (userId, data) => {
  const vehiclesData = [];
  const count = data.routeType === "TRIP_PLANNER" ? 1 : (data.vehicleCount || 1);
  
  if (count > 0) {
    for (let i = 1; i <= count; i++) {
      vehiclesData.push({
        name: `Vehicle ${i}`,
        capacity: 100
      });
    }
  }

  const job = await prisma.optimizationJob.create({
    data: {
      jobName: data.jobName,
      routeType: data.routeType,
      vehicleCount: data.vehicleCount,
      status: "DRAFT",
      userId: userId,
      vehicles: {
        create: vehiclesData
      }
    },
  });

  return job;
};

export const getUserJobs = async (userId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const [jobs, totalCount] = await Promise.all([
    prisma.optimizationJob.findMany({
      where: { userId: userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.optimizationJob.count({
      where: { userId: userId },
    })
  ]);

  return {
    jobs,
    pagination: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    }
  };
};

export const getJobById = async (jobId, userId) => {
  const job = await prisma.optimizationJob.findUnique({
    where: {
      id: jobId,
    },
    include: {
      vehicles: {
        orderBy: { id: "asc" }
      }
    }
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

export const updateVehicles = async (jobId, userId, vehiclesData) => {
  const job = await prisma.optimizationJob.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    throw new Error("Job not found");
  }

  if (job.userId !== userId) {
    throw new Error("Unauthorized to access this job");
  }

  // Ensure all vehicles actually belong to this job (security)
  const existingVehicles = await prisma.vehicle.findMany({
    where: { jobId: jobId },
  });
  
  const validVehicleIds = existingVehicles.map(v => v.id);

  // Update in a transaction
  const updates = vehiclesData.filter(v => validVehicleIds.includes(v.id)).map((vehicle) => {
    return prisma.vehicle.update({
      where: { id: vehicle.id },
      data: {
        name: vehicle.name,
        capacity: vehicle.capacity,
      },
    });
  });

  await prisma.$transaction(updates);
  return { success: true };
};

export const optimizeJob = async (jobId, userId) => {
  // ------------------------
  // Verify Job
  // ------------------------

  const job = await prisma.optimizationJob.findUnique({
    where: {
      id: jobId,
    },
    include: {
      vehicles: {
        orderBy: { id: "asc" }
      }
    }
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

  const isTripPlanner = job.routeType === "TRIP_PLANNER";

  let vehicleCapacities = [];
  if (job.vehicles && job.vehicles.length > 0) {
    vehicleCapacities = job.vehicles.map(v => isTripPlanner ? 1000000 : v.capacity);
  } else {
    const numVehicles = isTripPlanner ? 1 : job.vehicleCount;
    vehicleCapacities = Array(numVehicles).fill(isTripPlanner ? 1000000 : 100);
  }

  const payload = {
    coordinates: locations.map((location) => [
      location.longitude,
      location.latitude,
    ]),

    num_vehicles: vehicleCapacities.length,

    start_index: job.startIndex,

    end_index: job.endIndex,

    demands: locations.map((location) => (isTripPlanner ? 0 : (location.demand ?? 0))),

    vehicle_capacities: vehicleCapacities,

    // Time windows from DB, default to whole day (0 -> 86400)
    time_windows: locations.map((loc) => [
      loc.timeWindowStart !== null ? loc.timeWindowStart : 0,
      loc.timeWindowEnd !== null ? loc.timeWindowEnd : 86400
    ]),
  };

  // ------------------------
  // Call FastAPI
  // ------------------------

  const result = await optimize(payload);
  console.log("Python Backend Response for first route:", JSON.stringify(result.routes[0], null, 2));

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
    const stopsArray = routeData.stops || routeData.route.map(nodeIdx => ({ location_index: nodeIdx, distance_from_previous: null }));
    const routeStopsData = stopsArray.map((stop, sequence) => {
      const locationId = locations[stop.location_index].id;
      return {
        sequence: sequence,
        routeId: newRoute.id,
        locationId: locationId,
        distanceFromPrevious: stop.distance_from_previous,
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
        distanceFromPreviousKm: stop.distanceFromPrevious ? Number((stop.distanceFromPrevious / 1000).toFixed(2)) : 0,
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
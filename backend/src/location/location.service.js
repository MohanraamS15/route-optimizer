import prisma from "../config/prisma.js";
import { geocodeAddress } from "../utils/geocoder.js";

// Helper to delay for Nominatim rate limiting (1 request per second)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const addLocations = async (jobId, userId, locationsData) => {
  const job = await prisma.optimizationJob.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    throw new Error("Job not found");
  }

  if (job.userId !== userId) {
    throw new Error("Unauthorized to access this job");
  }

  const createdLocations = [];

  // Geocode and insert sequentially to respect OpenStreetMap Nominatim rate limits (1 request/sec)
  for (let i = 0; i < locationsData.length; i++) {
    const loc = locationsData[i];
    
    // Geocode the address
    const geoData = await geocodeAddress(loc.address);

    // Duplicate check
    const existing = await prisma.location.findFirst({
      where: {
        jobId: jobId,
        latitude: geoData.latitude,
        longitude: geoData.longitude,
      },
    });

    if (existing) {
      throw new Error("Location already exists in this optimization job.");
    }

    
    const newLocation = await prisma.location.create({
      data: {
        address: loc.address,
        latitude: geoData.latitude,
        longitude: geoData.longitude,
        demand: loc.demand !== undefined ? loc.demand : null,
        timeWindowStart: loc.timeWindowStart !== undefined ? loc.timeWindowStart : null,
        timeWindowEnd: loc.timeWindowEnd !== undefined ? loc.timeWindowEnd : null,
        jobId: jobId,
      },
    });

    createdLocations.push(newLocation);

    // Be nice to Nominatim (wait 1 second between requests) unless it's the last item
    if (i < locationsData.length - 1) {
      await sleep(1000);
    }
  }

  return createdLocations;
};

export const getLocations = async (jobId, userId) => {
  const job = await prisma.optimizationJob.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    throw new Error("Job not found");
  }

  if (job.userId !== userId) {
    throw new Error("Unauthorized to access this job");
  }

  const locations = await prisma.location.findMany({
    where: { jobId },
    orderBy: { createdAt: "asc" },
  });

  return locations;
};

export const updateLocation = async (locationId, userId, data) => {
  const location = await prisma.location.findUnique({
    where: { id: locationId },
    include: { job: true },
  });

  if (!location) {
    throw new Error("Location not found");
  }

  if (location.job.userId !== userId) {
    throw new Error("Unauthorized to update this location");
  }

  const updateData = { ...data };

  // If address changed, re-geocode
  if (data.address && data.address !== location.address) {
    const geoData = await geocodeAddress(data.address);

    // Duplicate check
    const existing = await prisma.location.findFirst({
      where: {
        jobId: location.jobId,
        latitude: geoData.latitude,
        longitude: geoData.longitude,
        id: { not: locationId },
      },
    });

    if (existing) {
      throw new Error("Location already exists in this optimization job.");
    }

    updateData.latitude = geoData.latitude;
    updateData.longitude = geoData.longitude;
  }

  const updatedLocation = await prisma.location.update({
    where: { id: locationId },
    data: updateData,
  });

  return updatedLocation;
};

export const deleteLocation = async (locationId, userId) => {
  const location = await prisma.location.findUnique({
    where: { id: locationId },
    include: { job: true },
  });

  if (!location) {
    throw new Error("Location not found");
  }

  if (location.job.userId !== userId) {
    throw new Error("Unauthorized to delete this location");
  }

  await prisma.location.delete({
    where: { id: locationId },
  });

  return true;
};

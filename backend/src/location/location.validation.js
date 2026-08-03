import { z } from "zod";

export const createLocationsSchema = z.object({
  locations: z.array(
    z.object({
      address: z.string().min(1, "Address is required"),
      demand: z.number().int().nonnegative("Demand must be a non-negative integer").optional(),
    })
  ).min(1, "At least one location is required"),
});

export const updateLocationSchema = z.object({
  address: z.string().min(1, "Address cannot be empty if provided").optional(),
  demand: z.number().int().nonnegative("Demand must be a non-negative integer").optional(),
});

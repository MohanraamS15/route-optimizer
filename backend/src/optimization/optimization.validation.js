import { z } from "zod";

export const createOptimizationJobSchema = z.object({
  jobName: z.string().min(3, "Job name must be at least 3 characters").max(255, "Job name is too long"),
  vehicleCount: z.number().int().positive("Vehicle count must be greater than zero"),
});

export const updateOptimizationJobSchema = z.object({
  jobName: z.string().min(3, "Job name must be at least 3 characters").max(255, "Job name is too long").optional(),
  vehicleCount: z.number().int().positive("Vehicle count must be greater than zero").optional(),
  depotIndex: z.number().int().min(0, "Depot index must be at least 0").optional(),
});

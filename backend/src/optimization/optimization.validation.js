import { z } from "zod";

const RouteTypeEnum = z.enum(["DELIVERY", "TRIP_PLANNER"]);

export const createOptimizationJobSchema = z.object({
  jobName: z.string().min(3, "Job name must be at least 3 characters").max(255, "Job name is too long"),
  routeType: RouteTypeEnum.optional().default("DELIVERY"),
  vehicleCount: z.number().int().positive("Vehicle count must be greater than zero").optional(),
}).superRefine((data, ctx) => {
  if (data.routeType === "DELIVERY" && !data.vehicleCount) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Vehicle count is required for DELIVERY routes",
      path: ["vehicleCount"],
    });
  }
});

export const updateOptimizationJobSchema = z.object({
  jobName: z.string().min(3, "Job name must be at least 3 characters").max(255, "Job name is too long").optional(),
  routeType: RouteTypeEnum.optional(),
  vehicleCount: z.number().int().positive("Vehicle count must be greater than zero").optional(),
  startIndex: z.number().int().min(0, "Start index must be at least 0").optional(),
  endIndex: z.number().int().min(0, "End index must be at least 0").optional(),
});

import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { create, getAll, getSingle, remove, update } from "./optimization.controller.js";

const router = Router();

// Apply authentication middleware to all optimization routes
router.use(authenticate);

router.post("/", create);
router.get("/", getAll);
router.get("/:id", getSingle);
router.patch("/:id", update);
router.delete("/:id", remove);

export default router;

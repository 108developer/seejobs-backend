import express from "express";
import { runPlanExpiry, runJobExpiry } from "../controllers/cron-jobs.js";

const router = express.Router();

router.post("/run-plan-expiry", runPlanExpiry);
router.post("/run-job-expiry", runJobExpiry);

export default router;

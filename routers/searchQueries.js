import express from "express";
import {
  searchSkills,
  searchJobTitles,
  searchDegrees,
  searchMedium,
  searchPercentageRange,
  searchJobTypes,
} from "../controllers/searchController.js";

const router = express.Router();

router.get("/searchSkills", searchSkills);
router.get("/searchJobTitles", searchJobTitles);
router.get("/searchDegrees", searchDegrees);
router.get("/searchMedium", searchMedium);
router.get("/searchPercentageRange", searchPercentageRange);
router.get("/searchJobTypes", searchJobTypes);

export default router;

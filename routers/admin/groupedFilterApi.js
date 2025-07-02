import express from "express";
import multer from "multer";

import {
  // Skill Endpoints
  bulkUploadSkills,
  addSkill,
  deleteSkill,
  getSkills,
  updateSkill,

  // Job Title Endpoints
  bulkUploadJobTitles,
  addJobTitle,
  deleteJobTitle,
  getJobTitles,
  updateJobTitle,

  // Degree Endpoints
  bulkUploadDegrees,
  addDegree,
  deleteDegree,
  getDegrees,
  updateDegree,

  // Board Endpoints
  bulkUploadBoards,
  addBoard,
  deleteBoard,
  getBoards,
  updateBoard,

  // Industry Endpoints
  bulkUploadIndustries,
  addIndustry,
  deleteIndustry,
  getIndustries,
  updateIndustry,

  // Language Endpoints
  bulkUploadLanguages,
  addLanguage,
  deleteLanguage,
  getLanguages,
  updateLanguage,

  // Location Endpoints
  bulkUploadLocations,
  addLocation,
  getLocation,
  getLocations,
  updateLocation,
  deleteLocation,
} from "../../controllers/admin/groupedFilterApi.js";

const router = express.Router();

// Setup multer for in-memory file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage }).single("file");

// Skill Routes
router.post("/skills/bulk-upload", bulkUploadSkills);
router.get("/skills", getSkills);
router.post("/skills", addSkill);
router.put("/skills/:id", updateSkill);
router.delete("/skills/:id", deleteSkill);

// Job Title Routes
router.post("/jobtitles/bulk-upload", bulkUploadJobTitles);
router.get("/jobtitles", getJobTitles);
router.post("/jobtitles", addJobTitle);
router.put("/jobtitles/:id", updateJobTitle);
router.delete("/jobtitles/:id", deleteJobTitle);

// Degree Routes
router.post("/degrees/bulk-upload", upload, bulkUploadDegrees);
router.get("/degrees", getDegrees);
router.post("/degrees", addDegree);
router.put("/degrees/:id", updateDegree);
router.delete("/degrees/:id", deleteDegree);

// Board Routes
router.post("/boards/bulk-upload", upload, bulkUploadBoards);
router.get("/boards", getBoards);
router.post("/boards", addBoard);
router.put("/boards/:id", updateBoard);
router.delete("/boards/:id", deleteBoard);

// Industry Routes
router.post("/industries/bulk-upload", upload, bulkUploadIndustries);
router.get("/industries", getIndustries);
router.post("/industries", addIndustry);
router.put("/industries/:id", updateIndustry);
router.delete("/industries/:id", deleteIndustry);

// Language Routes
router.post("/languages/bulk-upload", upload, bulkUploadLanguages);
router.get("/languages", getLanguages);
router.post("/languages", addLanguage);
router.put("/languages/:id", updateLanguage);
router.delete("/languages/:id", deleteLanguage);

// Location Routes
router.post("/locations/bulk-upload", upload, bulkUploadLocations);
router.post("/locations", addLocation);
router.get("/locations/:id", getLocation);
router.get("/locations", getLocations);
router.put("/locations/:id", updateLocation);
router.delete("/locations/:id", deleteLocation);

export default router;

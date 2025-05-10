// Keep this file
// path : routers/candidate/candidateAuthRoute.js

import express from "express";
import multer from "multer";
import {
  addWorkExperience,
  bulkUploadCandidates,
  deleteWorkExperience,
  getCandidateProfile,
  getEducationalDetails,
  getJobPreferences,
  getWorkExperience,
  login,
  register,
  saveEducationalDetails,
  saveJobPreferences,
  signup,
  // updateCandidateProfile,
  updateEducationalDetails,
  updateJobPreferences,
  updateProfilePic,
  updateRegistration,
  updateResume,
  updateWorkExperience,
} from "../../controllers/candidate/candidateAuth.js";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage }).fields([
  { name: "resume" },
  { name: "profilePic" },
]);

const uploadFiles = multer({ storage }).single("file");

// Skill Routes
router.post("/bulkUploadCandidates", uploadFiles, bulkUploadCandidates);

router.post("/login", login);
router.post("/signup", signup);
router.post("/register", upload, register);
// router.get("/updateCandidateProfile", updateCandidateProfile);
router.get("/getCandidateProfile/:candidateId", getCandidateProfile);

router.post("/saveJobPreferences", upload, saveJobPreferences);
router.get("/getJobPreferences", getJobPreferences);

// Routes for Updating Data
router.put("/updateRegisteredCandidate/:userId", updateRegistration);
router.put("/updateJobPreferences/:userId", updateJobPreferences);
router.put("/updateEducationalDetails/:userId", updateEducationalDetails);
router.put("/updateProfilePic/:userId", upload, updateProfilePic);
router.put("/updateResume/:userId", upload, updateResume);

router.post("/saveEducationalDetails", saveEducationalDetails);
router.get("/getEducationalDetails", getEducationalDetails);

// Work Experience
router.get("/getWorkExperience/:candidateId", getWorkExperience);
router.post("/addWorkExperience/:candidateId", addWorkExperience);
router.put("/updateWorkExperience/:candidateId", updateWorkExperience);
router.delete(
  "/deleteWorkExperience/:candidateId/:experienceId",
  deleteWorkExperience
);

export default router;

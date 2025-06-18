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
  resetCandidatePassword,
  saveEducationalDetails,
  saveJobPreferences,
  sendCandidateOtp,
  signup,
  updateEducationalDetails,
  updateJobPreferences,
  updateProfilePic,
  updateRegistration,
  updateResume,
  updateWorkExperience,
  uploadResume,
  verifyCandidateOtp,
} from "../../controllers/candidate/candidateAuth.js";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage }).fields([
  { name: "resume" },
  { name: "profilePic" },
]);

const uploadFiles = multer({ storage }).single("file");
const uploadMultipleFiles = multer({ storage }).array("file", 10);

// Skill Routes
router.post("/bulkUploadCandidates", uploadMultipleFiles, bulkUploadCandidates);

router.post("/login", login);
router.post("/signup", signup);
router.post("/uploadResume", upload, uploadResume);
router.post("/register", upload, register);
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

// Forgot Password
router.post("/sendCandidateOtp", sendCandidateOtp);
router.post("/verifyCandidateOtp", verifyCandidateOtp);
router.post("/resetCandidatePassword", resetCandidatePassword);

export default router;

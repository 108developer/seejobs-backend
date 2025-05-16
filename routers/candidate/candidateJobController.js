// path : routers/candidate/candidateAuthRoute.js

import express from "express";
import multer from "multer";
import {
  getCandidateProfile,
  getEducationalDetails,
  getJobPreferences,
  login,
  register,
  saveEducationalDetails,
  saveJobPreferences,
  signup,
  updateEducationalDetails,
  updateJobPreferences,
  updateProfilePic,
  updateRegistration,
  updateResume,
} from "../../controllers/candidate/candidateAuth.js";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage }).fields([
  { name: "resume" },
  { name: "profilePic" },
]);

router.post("/login", login);
router.post("/signup", signup);
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

export default router;

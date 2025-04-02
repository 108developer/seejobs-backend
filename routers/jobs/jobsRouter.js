// routes/jobRoutes.js
import express from "express";
import { applyJobsController } from "../../controllers/jobs/applyJobController.js";
import {
  getAllJobs,
  getJobById,
  getSearchJobs,
  getSimilarJobs,
  postJob,
  saveJobListing,
} from "../../controllers/jobs/jobsController.js";

import multer from "multer";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // specify the destination directory for resumes
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // specify the filename format
  },
});

const upload = multer({ storage: storage });

const router = express.Router();

// POST request to save a new job listing
router.post("/post-job", postJob);

router.post("/postjobs", saveJobListing);

router.get("/getjobs", getAllJobs);

router.get("/getjob/:id", getJobById);

router.get("/search", getSearchJobs);

router.post("/apply", upload.single("resume"), applyJobsController);

router.get("/similarjobs/:id", getSimilarJobs);

export default router;

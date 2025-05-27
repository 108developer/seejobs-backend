import express from "express";
import {
  adminLogin,
  currentEmlpoyers,
  currentJobs,
  currentUsers,
  createSeo,
  getTodaysJobPostings,
} from "../../controllers/admin/adminCotroller.js";
import {
  getAllJobs,
  getAllJobSeekers,
} from "../../controllers/admin/job-seekers.js";
import {
  getAllRecruiters,
  sendNewsLetter,
  updatePlan,
} from "../../controllers/admin/recruiters.js";

const router = express.Router();

router.post("/createSeo", createSeo);
router.post("/adminLogin", adminLogin);
router.get("/getAllJobs", getAllJobs);

router.get("/nousers", currentUsers);
router.get("/nojobs", currentJobs);
router.get("/noEmployers", currentEmlpoyers);
router.get("/todayjob", getTodaysJobPostings);

router.get("/getAllJobSeekers", getAllJobSeekers);
router.get("/getAllRecruiters", getAllRecruiters);
router.post("/updatePlan", updatePlan);
router.post("/sendNewsLetter", sendNewsLetter);

export default router;

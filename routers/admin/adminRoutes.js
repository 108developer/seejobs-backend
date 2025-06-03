import express from "express";
import {
  adminLogin,
  currentEmlpoyers,
  currentJobs,
  currentUsers,
  createSeo,
  getTodaysJobPostings,
  getSeo,
  getSeoByPage,
  updateSeo,
  deleteSeo,
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

router.get("/seo", getSeo);
router.get("/seo/:page", getSeoByPage);
router.post("/seo", createSeo);
router.put("/seo/:page", updateSeo);
router.delete("/seo/:page", deleteSeo);

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

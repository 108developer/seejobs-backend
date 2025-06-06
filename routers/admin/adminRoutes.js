import express from "express";
import {
  adminLogin,
  createSeo,
  currentEmlpoyers,
  currentJobs,
  currentUsers,
  deleteSeo,
  getSeo,
  getSeoByPage,
  getTodaysJobPostings,
  updateSeo,
} from "../../controllers/admin/adminCotroller.js";
import {
  createContact,
  getContact,
  updateContact,
  contactEnquiery,
} from "../../controllers/admin/contactController.js";
import {
  getAllJobs,
  getAllJobSeekers,
} from "../../controllers/admin/job-seekers.js";
import {
  createOrReplacePage,
  getPage,
  updatePage,
} from "../../controllers/admin/pageController.js";
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

router.get("/pages/:type", getPage);
router.post("/pages/:type", createOrReplacePage);
router.put("/pages/:type", updatePage);

router.get("/contact", getContact);
router.post("/contact", createContact);
router.put("/contact", updateContact);
router.post("/contactEnquiery", contactEnquiery);

export default router;

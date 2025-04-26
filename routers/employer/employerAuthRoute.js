// Keep this file
// path : routers/employer/employerAuthRoute.js

import express from "express";
import multer from "multer";
import {
  getEmployerProfile,
  login,
  register,
  updateRecruiter,
} from "../../controllers/employer/employerAuth.js";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage }).fields([
  { name: "resume" },
  { name: "profilePic" },
]);

router.post("/login", login);
router.post("/register", register);
router.get("/getEmployerProfile/:userid", getEmployerProfile);
router.put("/updateRecruiter/:userid", updateRecruiter);

export default router;

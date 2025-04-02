// Keep this file
// path : routers/employer/employerAuthRoute.js

import express from "express";
import multer from "multer";
import { login, register } from "../../controllers/employer/employerAuth.js";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage }).fields([
  { name: "resume" },
  { name: "profilePic" },
]);

router.post("/login", login);
router.post("/register", register);

export default router;

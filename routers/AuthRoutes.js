// routes/authRoutes.js
import express from "express";
import multer from "multer";
import {
  getCandidateProfile,
  getSeacthUser,
  getSingleUser,
  login,
  register,
  updateUserProfile,
} from "../controllers/Authcontroller.js";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage }).fields([
  { name: "resume" },
  { name: "profilePic" },
]);

router.post("/register", upload, register);
router.post("/login", login);
router.get("/user/:id", getSingleUser);
router.get("/search", getSeacthUser);
router.get("/profile/:userid", getCandidateProfile);
router.put("/update/:userid", upload, updateUserProfile);

export default router;

// routes/authRoutes.js
import express from "express";
import {
  createBlog,
  deleteBlogById,
  getAllBlog,
  getBlogByUrl,
  updateBlogById,
} from "../controllers/admin/blogController.js";

const router = express.Router();

router.post("/create-blog", createBlog);
router.get("/get-all-blog", getAllBlog);
router.get("/get-blog-by-url/:url", getBlogByUrl);
router.put("/update-blog-by-id/:id", updateBlogById);
router.delete("/delete-blog-by-id/:id", deleteBlogById);

export default router;

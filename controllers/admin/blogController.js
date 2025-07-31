import Blog from "../../models/blog.js";

// POST /api/create-blog
export const createBlog = async (req, res) => {
  try {
    const blog = new Blog(req.body);
    const saved = await blog.save();
    res
      .status(201)
      .json({ success: true, message: "Blog created", data: saved });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// GET /api/get-all-blog
export const getAllBlog = async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.json({ success: true, data: blogs });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch blogs" });
  }
};

// GET /api/get-blog-by-url/:url
export const getBlogByUrl = async (req, res) => {
  try {
    const blog = await Blog.findOne({ url: req.params.url });
    if (!blog) {
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    }
    res.json({ success: true, data: blog });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/update-blog-by-id/:id
export const updateBlogById = async (req, res) => {
  try {
    const updated = await Blog.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    }
    res.json({ success: true, message: "Blog updated", data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE /api/delete-blog-by-id/:id
export const deleteBlogById = async (req, res) => {
  try {
    const deleted = await Blog.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    }
    res.json({ success: true, message: "Blog deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

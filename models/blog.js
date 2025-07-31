import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    metaDescription: { type: String, required: true },
    url: {
      type: String,
      required: true,
      unique: true,
      match: /^[a-z0-9-]+$/,
    },
    content: { type: String, required: true },
    keywords: { type: [String], required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Blog", blogSchema);

import mongoose from "mongoose";

const seoSchema = new mongoose.Schema({
  page: { type: String, require: true, unique: true },
  metaTitle: { type: String, required: true, unique: true },
  metaDescription: { type: String, required: true },
  metaKeywords: { type: [String], default: [] },
  canonicalUrl: { type: String },
  robots: {
    type: String,
    enum: [
      "index, follow",
      "noindex, follow",
      "index, nofollow",
      "noindex, nofollow",
    ],
    default: "index, follow",
  },
  og: {
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    url: { type: String, default: "" },
    type: { type: String, default: "article" },
  },
  twitter: {
    card: { type: String, default: "" },
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    site: { type: String, default: "" },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Seo", seoSchema);

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
    type: String,
    description: String,
    image: String,
    url: String,
    type: String,
  },
  twitter: {
    card: String,
    title: String,
    description: String,
    image: String,
    site: String,
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

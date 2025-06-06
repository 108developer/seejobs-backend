import mongoose from "mongoose";

const pageSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ["about", "privacy", "terms"],
    unique: true,
  },
  description: {
    type: String,
    required: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Page", pageSchema);

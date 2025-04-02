// models/JobTitle.js
import mongoose from "mongoose";

const jobTitleSchema = new mongoose.Schema({
  value: {
    type: String,
    required: true,
    unique: true,
  },
  label: {
    type: String,
    required: true,
  },
});

const JobTitle = mongoose.model("JobTitle", jobTitleSchema);
export default JobTitle;

// models/JobType.js
import mongoose from "mongoose";

const jobTypeSchema = new mongoose.Schema({
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

const JobType = mongoose.model("JobType", jobTypeSchema);
export default JobType;

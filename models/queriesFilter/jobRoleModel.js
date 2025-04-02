import mongoose from "mongoose";

const jobRoleSchema = new mongoose.Schema({
  value: { type: String, required: true, unique: true },
  label: { type: String, required: true },
});

const JobRole = mongoose.model("JobRole", jobRoleSchema);

export default JobRole;

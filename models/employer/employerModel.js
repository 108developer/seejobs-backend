// TODO : update Employer schema as per new requirements
import mongoose from "mongoose";

const employerSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    email: {
      type: String,
      unique: true,
    },
    mobileNumber: {
      type: String,
    },
    password: {
      type: String,
    },
    location: { type: String },
    skills: {
      type: [String],
    },
    companyName: {
      type: String,
    },
    designation: {
      type: String,
    },
    address: {
      type: String,
    },
    city: {
      type: String,
    },
    zipCode: {
      type: String,
    },
    state: {
      type: String,
    },
    totalExperience: {
      type: String,
    },
    level: {
      type: String,
    },
    industry: {
      type: String,
    },
    achievements: {
      type: String,
    },
    description: { type: String },
    role: {
      type: String,
      enum: ["user", "employer"],
    },
    postedJobs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "JobListing",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Employer = mongoose.model("Employer", employerSchema);

export default Employer;

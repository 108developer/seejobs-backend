import mongoose from "mongoose";

const { Schema, model } = mongoose;

const jobListingSchema = new Schema(
  {
    employerId: {
      type: String,
      required: true,
    },
    jobTitle: {
      type: String,
    },
    jobType: {
      type: [String],
    },
    role: {
      type: String,
    },
    monthlySalary: {
      min: {
        type: Number,
      },
      max: {
        type: Number,
      },
    },
    experience: {
      min: {
        type: Number,
      },
      max: {
        type: Number,
      },
    },
    country: {
      type: String,
    },
    state: {
      type: String,
    },
    city: {
      type: String,
    },
    locality: {
      type: String,
    },
    jobDescription: {
      type: String,
    },
    hiringForCompanies: {
      type: String,
    },
    email: {
      type: String,
    },
    phone: {
      type: String,
    },
    category: {
      type: String,
    },
    education: {
      type: [String],
    },
    skills: {
      type: [String],
    },
  },
  {
    timestamps: true,
  }
);

const JobListing = model("JobListing", jobListingSchema);

export default JobListing;

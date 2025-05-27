// TODO : update Employer schema as per new requirements
import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
  plan: {
    type: String,
    enum: ["Free", "Basic", "Premium"],
    default: "Free",
  },
  status: {
    type: String,
    enum: ["Active", "Inactive", "Cancelled", "Expired"],
    default: "Inactive",
  },
  startDate: Date,
  endDate: Date,
  allowedResume: {
    type: Number,
    default: 0,
  },
  viewedResume: {
    type: Number,
    default: 0,
  },
});

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
    refreshToken: {
      type: String,
    },
    accessToken: {
      type: String,
    },
    subscription: subscriptionSchema,
  },
  {
    timestamps: true,
  }
);

const Employer = mongoose.model("Employer", employerSchema);

export default Employer;

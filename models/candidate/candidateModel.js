// Keep this file
// path : models/candidate/candidateModel.js

import mongoose from "mongoose";

const candidateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "Candidate" },

  // Registration details
  registration: {
    fullName: { type: String },
    email: { type: String, unique: true },
    phone: { type: String },
    password: { type: String },
    location: { type: String },
    minexp: { type: Number },
    maxexp: { type: Number },
    skills: { type: [String] },
    industry: { type: String },
    resume: { type: String },
    jobDescription: { type: String },
    terms: { type: Boolean },
    role: { type: String, default: "candidate" },
  },

  // Job Preferences details
  jobPreferences: {
    profileTitle: { type: String },
    jobRoles: { type: [String], max: 2 },
    jobType: { type: String },
    experience: {
      years: { type: Number },
      months: { type: Number },
    },
    gender: { type: String },
    dob: { type: Date },
    maritalStatus: { type: String },
    language: { type: String },
    image: { type: String },
  },

  // Educational details
  candidateEducation: {
    highestQualification: { type: String },
    medium: { type: String },
    boardOfEducation: { type: String },
    percentage: { type: String },
    yearOfEducation: { type: String },
    educationMode: { type: String },
  },
});

const Candidate = mongoose.model("Candidate", candidateSchema);

export default Candidate;

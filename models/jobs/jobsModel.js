import mongoose from "mongoose";

const { Schema, model } = mongoose;

const jobListingSchema = new Schema(
  {
    // Employer and Applicants
    employer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employer",
      required: true,
    },
    applicants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Candidate",
      },
    ],

    // Job Info
    jobTitle: {
      type: String,
      required: true,
    },
    url: {
      type: String,
    },
    jobRole: {
      type: String,
    },
    category: {
      type: String,
    },
    jobType: {
      type: [String],
    },
    jobDescription: {
      type: String,
    },
    jobLocation: {
      type: String,
    },
    openings: {
      type: Number,
      default: 1,
      min: 1,
    },
    deadline: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["open", "closed", "paused"],
      default: "open",
    },

    // Compensation & Experience
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
    education: {
      type: String,
    },
    skillsRequired: {
      type: [String],
    },

    // Application Questions Schema
    questions: [
      {
        questionText: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          enum: ["text", "single-choice", "multiple-choice"],
          required: true,
        },
        options: [
          {
            type: String,
          },
        ],
      },
    ],

    applications: [
      {
        candidate: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Candidate",
          required: true,
        },
        answers: [
          {
            questionId: mongoose.Schema.Types.ObjectId,
            answer: mongoose.Schema.Types.Mixed,
          },
        ],
        resume: {
          type: String,
        },
        attachedDocument: {
          type: String,
        },
        appliedAt: {
          type: Date,
          default: Date.now,
        },

        hasApplied: {
          type: Boolean,
          default: false,
        },
      },
    ],

    // Company Info
    companyName: {
      type: String,
    },
    companyEmail: {
      type: String,
    },
    companyPhone: {
      type: String,
    },
    companyWebsite: {
      type: String,
    },
    companyDescription: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const JobListing = model("JobListing", jobListingSchema);

export default JobListing;

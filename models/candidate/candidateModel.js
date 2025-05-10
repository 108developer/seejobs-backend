import mongoose from "mongoose";

const candidateSchema = new mongoose.Schema(
  {
    registration: {
      fullName: { type: String },
      email: { type: String, unique: true },
      phone: { type: String },
      password: { type: String },
      location: { type: String },
      permanentAddress: { type: String },
      minexp: { type: Number },
      maxexp: { type: Number },
      skills: { type: [String] },
      industry: { type: String },
      resume: { type: String },
      jobDescription: { type: String },
      terms: { type: Boolean },
      role: { type: String, default: "candidate" },
    },

    jobPreferences: {
      profilePic: { type: String },
      profileTitle: { type: String },
      jobRoles: { type: [String], max: 2 },
      jobType: { type: String },
      preferredJobLocation: { type: [String] },
      experience: {
        years: { type: Number },
        months: { type: Number },
      },
      gender: { type: String },
      dob: { type: Date },
      age: { type: Number },
      currentSalary: { type: Number },
      expectedSalary: { type: Number },
      maritalStatus: { type: String },
      language: { type: String },
      image: { type: String },
    },

    candidateEducation: {
      highestQualification: { type: String },
      medium: { type: String },
      boardOfEducation: { type: String },
      percentage: { type: String },
      yearOfEducation: { type: String },
      educationMode: { type: String },
    },

    workExperience: [
      {
        jobTitle: { type: String },
        companyName: { type: String },
        startDate: { type: Date },
        currentlyEmployed: { type: Boolean, default: false },
        endDate: { type: Date },
        jobDescription: { type: String },
        industry: { type: String },
        location: { type: String },
        noticePeriod: {
          type: String,
          enum: [
            "Immediate",
            "30 Days",
            "45 Days",
            "60 Days",
            "75 Days",
            "90 Days",
          ],
        },
      },
    ],

    additionalInfo: {
      profilePic: { type: String },
      resume: { type: String },
      document: { type: String },
      noticePeriod: { type: String },
      experience: {
        years: { type: Number },
        months: { type: Number },
      },
      currentSalary: { type: Number },
      expectedSalary: { type: Number },
      terms: { type: Boolean },
      role: { type: String, default: "candidate" },
    },

    language: [
      {
        languageName: { type: String },
        proficiency: {
          type: String,
          enum: ["Beginner", "Intermediate", "Advanced", "Fluent", "Native"],
          required: true,
        },
      },
    ],

    status: {
      isActive: { type: Boolean, default: true },
      lastLogin: { type: Date },
    },

    statusBy: [
      {
        recruiter: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Employer",
        },
        date: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: [
            "Pending",
            "Viewed",
            "Hold",
            "Shortlisted",
            "Rejected",
            "Hired",
          ],
          default: "Pending",
        },
      },
    ],

    jobs: {
      appliedJobs: [
        {
          job: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "JobListing",
          },
          status: {
            type: String,
            enum: [
              "Pending",
              "Viewed",
              "Hold",
              "Shortlisted",
              "Rejected",
              "Hired",
            ],
            default: "Pending",
          },
          appliedDate: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      savedJobs: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "JobListing",
        },
      ],
      shortlistedBy: [
        {
          recruiter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Recruiter",
          },
          job: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "JobListing",
          },
          date: {
            type: Date,
            default: Date.now,
          },
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

const Candidate = mongoose.model("Candidate", candidateSchema);

export default Candidate;

{
  /*
   ***********************************************************
   A PROPER DATA STRUCTURE FOR CANDIDATE SCHEMA IS WRITTEN BELOW
   ***********************************************************
   */
}

// import mongoose from "mongoose";

// const candidateSchema = new mongoose.Schema(
//   {
//     personalInfo: {
//       fullName: { type: String, required: true },
//       email: { type: String, unique: true, required: true },
//       phone: { type: String, required: true },
//       password: { type: String, required: true },
//       description: { type: String },
//       currentLocation: { type: String },
//       permanentAddress: { type: String },
//       gender: { type: String },
//       dob: { type: Date },
//       age: { type: Number },
//       maritalStatus: { type: String },
//     },

//     jobPreference: {
//       jobTitle: { type: String },
//       jobRoles: { type: [String], min: 1, max: 5 },
//       jobType: { type: String },
//       jobIndustry: { type: String },
//       jobLocation: { type: [String] },
//     },

//     education: [
//       {
//         degree: { type: String },
//         medium: { type: String },
//         board: { type: String },
//         percentage: { type: String },
//         startYear: { type: String },
//         passoutYear: { type: String },
//         mode: { type: String },
//       },
//     ],

//     skills: [
//       {
//         skillName: { type: String, required: true },
//         proficiency: {
//           type: String,
//           enum: ["Beginner", "Intermediate", "Advanced", "Expert"],
//           default: "Intermediate",
//         },
//       },
//     ],

//     workExperience: [
//       {
//         companyName: { type: String },
//         jobTitle: { type: String },
//         startDate: { type: Date },
//         currentlyEmployed: { type: Boolean, default: false },
//         endDate: { type: Date },
//         jobDescription: { type: String },
//         industry: { type: String },
//         location: { type: String },
//       },
//     ],

//     additionalInfo: {
//       profilePic: { type: String },
//       resume: { type: String },
//       document: { type: String },
//       noticePeriod: { type: String },
//       experience: {
//         years: { type: Number },
//         months: { type: Number },
//       },
//       currentSalary: { type: Number },
//       expectedSalary: { type: Number },
//       terms: { type: Boolean, required: true },
//       role: { type: String, default: "candidate" },
//     },

//     language: [
//       {
//         languageName: { type: String },
//         proficiency: {
//           type: String,
//           enum: ["Beginner", "Intermediate", "Advanced", "Fluent", "Native"],
//           required: true,
//         },
//       },
//     ],

//     socialLinks: {
//       linkedIn: { type: String },
//       github: { type: String },
//       portfolio: { type: String },
//     },

//     status: {
//       isActive: { type: Boolean, default: true },
//       lastLogin: { type: Date },
//     },

//     jobs: {
//       appliedJobs: [
//         {
//           job: { type: mongoose.Schema.Types.ObjectId, ref: "JobListing" },
//           status: {
//             type: String,
//             enum: ["pending", "shortlisted", "rejected", "withdrawn"],
//             default: "pending",
//           },
//           appliedDate: { type: Date, default: Date.now },
//         },
//       ],

//       savedJobs: [
//         {
//           type: mongoose.Schema.Types.ObjectId,
//           ref: "JobListing",
//         },
//       ],

//       shortlistedBy: [
//         {
//           recruiter: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: "Recruiter",
//           },
//           job: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: "JobListing",
//           },
//           date: { type: Date, default: Date.now },
//         },
//       ],
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// const Candidate = mongoose.model("Candidate", candidateSchema);

// export default Candidate;

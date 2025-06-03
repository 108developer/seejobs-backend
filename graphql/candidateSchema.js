import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from "graphql";

import Candidate from "../models/candidate/candidateModel.js";
import Employer from "../models/employer/employerModel.js";

function calculateAge(dob) {
  const diff = Date.now() - dob.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

const CandidateType = new GraphQLObjectType({
  name: "Candidate",
  fields: {
    id: { type: GraphQLID },
    name: { type: GraphQLString },
    email: { type: GraphQLString },
    phone: { type: GraphQLString },
    jobTitle: { type: GraphQLString },
    jobRole: { type: GraphQLString },
    skills: { type: new GraphQLList(GraphQLString) },
    location: { type: GraphQLString },
    salary: { type: GraphQLFloat },
    experience: { type: GraphQLInt },
    degree: { type: GraphQLString },
    gender: { type: GraphQLString },
    age: { type: GraphQLInt },
    currentSalary: { type: GraphQLFloat },
    expectedSalary: { type: GraphQLFloat },
    profilePic: { type: GraphQLString },
    resume: { type: GraphQLString },
    matchedSkills: { type: new GraphQLList(GraphQLString) },
    unmatchedSkills: { type: new GraphQLList(GraphQLString) },
    matchedSkillsCount: { type: GraphQLInt },
    degree: { type: GraphQLString },
    board: { type: GraphQLString },
    medium: { type: GraphQLString },
    mode: { type: GraphQLString },
    recruiterStatus: { type: GraphQLString },
    // status: { type: GraphQLString },
  },
});

const RootQuery = new GraphQLObjectType({
  name: "RootQueryType",
  fields: {
    getAllCandidates: {
      type: new GraphQLObjectType({
        name: "CandidateResponse",
        fields: {
          success: { type: GraphQLBoolean },
          message: { type: GraphQLString },
          totalCandidates: { type: GraphQLInt },
          currentPage: { type: GraphQLInt },
          totalPages: { type: GraphQLInt },
          candidates: { type: new GraphQLList(CandidateType) },
        },
      }),
      args: {
        employerId: { type: GraphQLID },
        skills: { type: new GraphQLList(GraphQLString) },
        location: { type: GraphQLString },
        jobTitle: { type: GraphQLString },
        jobRole: { type: GraphQLString },
        jobTypes: { type: new GraphQLList(GraphQLString) },
        salaryMin: { type: GraphQLFloat },
        salaryMax: { type: GraphQLFloat },
        experienceMin: { type: GraphQLInt },
        experienceMax: { type: GraphQLInt },
        degree: { type: GraphQLString },
        gender: { type: GraphQLString },
        ageMin: { type: GraphQLInt },
        ageMax: { type: GraphQLInt },
        status: { type: GraphQLString },
        page: { type: GraphQLInt },
        limit: { type: GraphQLInt },
      },
      async resolve(_, args) {
        try {
          const {
            employerId,
            skills,
            location,
            jobTitle,
            jobRole,
            jobTypes,
            salaryMin,
            salaryMax,
            experienceMin,
            experienceMax,
            degree,
            gender,
            ageMin,
            ageMax,
            status,
            page = 1,
            limit = 10,
          } = args;

          const filters = {};

          const isNonEmpty = (val) => Array.isArray(val) && val.length > 0;
          const isStringFilled = (str) =>
            typeof str === "string" && str.trim().length > 0;

          // if (isNonEmpty(skills)) {
          //   filters["registration.skills"] = { $in: skills };
          // }

          if (isNonEmpty(skills)) {
            filters["$or"] = skills.map((skill) => ({
              "registration.skills": {
                $regex: new RegExp(`^${skill}$`, "i"),
              },
            }));
          }

          // if (isStringFilled(location)) {
          //   filters["registration.location"] = {
          //     $regex: location,
          //     $options: "i",
          //   };
          // }

          if (isStringFilled(location)) {
            const parts = location.split(",").map((part) => part.trim());
            const [city, state] = parts;

            filters["$and"] = [
              {
                "registration.location": {
                  $regex: new RegExp(city, "i"),
                },
              },
              {
                "registration.location": {
                  $regex: new RegExp(state, "i"),
                },
              },
            ];
          }

          if (isStringFilled(jobTitle)) {
            filters["jobPreferences.profileTitle"] = {
              $regex: jobTitle,
              $options: "i",
            };
          }

          if (isStringFilled(jobRole)) {
            filters["jobPreferences.jobRoles"] = {
              $regex: jobRole,
              $options: "i",
            };
          }

          if (isNonEmpty(jobTypes)) {
            filters["jobPreferences.jobType"] = { $in: jobTypes };
          }

          if (isStringFilled(degree)) {
            filters["candidateEducation.highestQualification"] = {
              $regex: degree,
              $options: "i",
            };
          }

          if (isStringFilled(gender)) {
            filters["jobPreferences.gender"] = gender;
          }

          if (employerId && isStringFilled(args.status)) {
            const recruiterStatusFilter = {
              statusBy: {
                $elemMatch: {
                  recruiter: employerId,
                  status: new RegExp(`^${args.status}$`, "i"),
                },
              },
            };

            filters.$and = filters.$and
              ? [...filters.$and, recruiterStatusFilter]
              : [recruiterStatusFilter];
          }

          // // Experience filter
          // if (
          //   typeof experienceMin === "number" ||
          //   typeof experienceMax === "number"
          // ) {
          //   const range = {};
          //   if (typeof experienceMin === "number") range.$gte = experienceMin;
          //   if (typeof experienceMax === "number") range.$lte = experienceMax;

          //   filters["registration.maxexp"] = range;
          // }

          // // Age filter
          // if (typeof ageMin === "number" || typeof ageMax === "number") {
          //   const range = {};
          //   if (typeof ageMin === "number") range.$gte = ageMin;
          //   if (typeof ageMax === "number") range.$lte = ageMax;

          //   filters["jobPreferences.age"] = range;
          // }

          // // Salary filter
          // if (typeof salaryMin === "number" || typeof salaryMax === "number") {
          //   const salaryFilter = [];

          //   if (typeof salaryMin === "number") {
          //     salaryFilter.push({
          //       $or: [
          //         { "jobPreferences.currentSalary": { $gte: salaryMin } },
          //         { "jobPreferences.expectedSalary": { $gte: salaryMin } },
          //       ],
          //     });
          //   }

          //   if (typeof salaryMax === "number") {
          //     salaryFilter.push({
          //       $or: [
          //         { "jobPreferences.currentSalary": { $lte: salaryMax } },
          //         { "jobPreferences.expectedSalary": { $lte: salaryMax } },
          //       ],
          //     });
          //   }

          //   // Combine salary filters with $and
          //   if (salaryFilter.length > 0) {
          //     filters.$and = filters.$and
          //       ? [...filters.$and, ...salaryFilter]
          //       : salaryFilter;
          //   }
          // }

          const totalCandidates = await Candidate.countDocuments(filters);

          const candidates = await Candidate.find(filters)
            .sort({ updatedAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

          const enrichedCandidates = candidates.map((c) => {
            const candidateSkills = c.registration.skills || [];
            const inputSkills = Array.isArray(skills) ? skills : [];
            const matchedSkills = inputSkills.filter((skill) =>
              candidateSkills.includes(skill)
            );
            const unmatchedSkills = inputSkills.filter(
              (skill) => !candidateSkills.includes(skill)
            );
            const dob = c?.jobPreferences?.dob;
            const age = dob ? calculateAge(new Date(dob)) : null;

            let recruiterStatus = null;
            if (employerId) {
              const statusEntry = c.statusBy.find(
                (entry) => entry.recruiter.toString() === employerId
              );
              recruiterStatus = statusEntry ? statusEntry.status : null;
            }

            return {
              id: c._id,
              name: c.registration.fullName,
              email: c.registration.email,
              phone: c.registration.phone,
              jobTitle: c.jobPreferences.profileTitle,
              jobRole: Array.isArray(c.jobPreferences.jobRoles)
                ? c.jobPreferences.jobRoles[0]
                : c.jobPreferences.jobRoles,
              location: c.registration.location,
              experience: c.registration.maxexp,
              degree: c.candidateEducation.highestQualification,
              gender: c.jobPreferences.gender,
              age: c.jobPreferences.age,
              currentSalary: c.jobPreferences.currentSalary || null,
              expectedSalary: c.jobPreferences.expectedSalary || null,
              matchedSkills,
              unmatchedSkills,
              matchedSkillsCount: matchedSkills.length,
              skills: c.registration.skills,
              profilePic: c.jobPreferences.profilePic,
              resume: c.registration.resume,
              board: c.candidateEducation.boardOfEducation,
              medium: c.candidateEducation.medium,
              mode: c.candidateEducation.educationMode,
              recruiterStatus,
            };
          });

          const sortedCandidates = isNonEmpty(skills)
            ? enrichedCandidates.sort(
                (a, b) => b.matchedSkillsCount - a.matchedSkillsCount
              )
            : enrichedCandidates;

          return {
            success: true,
            message: "Filtered candidates retrieved successfully",
            totalCandidates,
            currentPage: page,
            totalPages: Math.ceil(totalCandidates / limit),
            candidates: sortedCandidates,
          };
        } catch (err) {
          console.error("❌ Error in getAllCandidates:", err);
          return {
            success: false,
            message: err.message,
            totalCandidates: 0,
            currentPage: 1,
            totalPages: 1,
            candidates: [],
          };
        }
      },
    },
  },
});

const RootMutation = new GraphQLObjectType({
  name: "Mutation",
  fields: {
    updateCandidateStatus: {
      type: new GraphQLObjectType({
        name: "UpdateStatusResponse",
        fields: {
          success: { type: GraphQLBoolean },
          message: { type: GraphQLString },
        },
      }),
      args: {
        candidateId: { type: GraphQLID },
        status: { type: GraphQLString },
        recruiterId: { type: GraphQLID },
      },
      async resolve(_, { candidateId, status, recruiterId }) {
        try {
          const validStatuses = [
            "Pending",
            "Viewed",
            "Hold",
            "Shortlisted",
            "Rejected",
            "Hired",
          ];
          const formattedStatus =
            status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

          if (!validStatuses.includes(formattedStatus)) {
            return {
              success: false,
              message: `Invalid status: ${status}. Valid statuses are ${validStatuses.join(
                ", "
              )}.`,
            };
          }

          const candidate = await Candidate.findById(candidateId);
          if (!candidate) {
            return {
              success: false,
              message: "Candidate not found.",
            };
          }

          const existingStatusIndex = candidate.statusBy.findIndex(
            (entry) => entry.recruiter.toString() === recruiterId
          );

          if (existingStatusIndex > -1) {
            // Update existing entry
            candidate.statusBy[existingStatusIndex].status = formattedStatus;
            candidate.statusBy[existingStatusIndex].date = new Date();
          } else {
            // Add new entry
            candidate.statusBy.push({
              recruiter: recruiterId,
              status: formattedStatus,
              date: new Date(),
            });
          }

          candidate.jobs.appliedJobs.forEach((job) => {
            if (job.status === "Pending") {
              job.status = formattedStatus;
            }
          });

          await candidate.save();

          return {
            success: true,
            message: "Application status updated successfully.",
          };
        } catch (error) {
          console.error("Error updating status:", error);
          return {
            success: false,
            message: "Internal server error.",
          };
        }
      },
    },
  },
});

const schema = new GraphQLSchema({
  query: RootQuery,
  mutation: RootMutation,
});

export default schema;

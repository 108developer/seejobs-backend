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

import mongoose from "mongoose";
import Candidate from "../models/candidate/candidateModel.js";
import Employer from "../models/employer/employerModel.js";
import { handleResumeView } from "../utils/handleResumeAccess.js";

function calculateAge(dob) {
  const diff = Date.now() - dob.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

function getFreshnessFilter(freshness) {
  const now = new Date();
  let dateRange;

  switch (freshness) {
    case "24h":
      dateRange = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case "3d":
      dateRange = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      break;
    case "7d":
      dateRange = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "15d":
      dateRange = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      dateRange = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      return null;
  }

  return { $gte: dateRange };
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
    board: { type: GraphQLString },
    medium: { type: GraphQLString },
    mode: { type: GraphQLString },
    recruiterStatus: { type: GraphQLString },
    updatedAt: { type: GraphQLString },
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
          totalCount: { type: GraphQLInt },
          viewedCount: { type: GraphQLInt },
          shortlistedCount: { type: GraphQLInt },
          rejectedCount: { type: GraphQLInt },
          holdCount: { type: GraphQLInt },
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
        freshness: { type: GraphQLString },
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
            freshness,
            page = 1,
            limit = 10,
          } = args;

          const baseFilters = {};

          // Freshness filter
          if (freshness) {
            const freshnessFilter = getFreshnessFilter(freshness);
            if (freshnessFilter) {
              baseFilters.updatedAt = freshnessFilter;
            }
          }

          const isNonEmpty = (val) => Array.isArray(val) && val.length > 0;
          const isStringFilled = (str) =>
            typeof str === "string" && str.trim().length > 0;

          // if (isNonEmpty(skills)) {
          //   filters["registration.skills"] = { $in: skills };
          // }

          // if (isNonEmpty(skills)) {
          //   filters["$or"] = skills.map((skill) => ({
          //     "registration.skills": {
          //       $regex: new RegExp(`^${skill}$`, "i"),
          //     },
          //   }));
          // }

          if (Array.isArray(skills) && skills.length > 0) {
            const filtersForSkillsAndTitles = [];

            for (const keyword of skills) {
              if (typeof keyword === "string" && keyword.trim() !== "") {
                const regex = new RegExp(keyword.trim(), "i");

                filtersForSkillsAndTitles.push(
                  { "registration.skills": { $in: [regex] } },
                  { "jobPreferences.profileTitle": { $regex: regex } },
                  { "workExperience.jobTitle": { $regex: regex } }
                );
              }
            }

            if (filtersForSkillsAndTitles.length > 0) {
              baseFilters.$or = filtersForSkillsAndTitles;
            }
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

            baseFilters.$and = [
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

          // if (isStringFilled(jobTitle)) {
          //   filters["jobPreferences.profileTitle"] = {
          //     $regex: jobTitle,
          //     $options: "i",
          //   };
          // }

          if (isStringFilled(jobRole)) {
            baseFilters["jobPreferences.jobRoles"] = {
              $regex: jobRole,
              $options: "i",
            };
          }

          if (isNonEmpty(jobTypes)) {
            baseFilters["jobPreferences.jobType"] = { $in: jobTypes };
          }

          if (isStringFilled(degree)) {
            baseFilters["candidateEducation.highestQualification"] = {
              $regex: degree,
              $options: "i",
            };
          }

          if (isStringFilled(gender)) {
            baseFilters["jobPreferences.gender"] = gender;
          }

          // .................................................
          // .................................................
          // .................................................

          // if (employerId && isStringFilled(args.status)) {
          //   const recruiterStatusFilter = {
          //     statusBy: {
          //       $elemMatch: {
          //         recruiter: employerId,
          //         status: new RegExp(`^${args.status}$`, "i"),
          //       },
          //     },
          //   };

          //   filters.$and = filters.$and
          //     ? [...filters.$and, recruiterStatusFilter]
          //     : [recruiterStatusFilter];
          // }

          // .................................................
          // .................................................
          // .................................................

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

          // const matchStage = { $match: countFilters };

          // const matchStage = { $match: filters };

          // const unwindStage = { $unwind: "$statusBy" };

          // const groupStage = {
          //   $group: {
          //     _id: "$statusBy.status",
          //     count: { $sum: 1 },
          //   },
          // };

          // const aggregation = await Candidate.aggregate([
          //   matchStage,
          //   unwindStage,
          //   groupStage,
          // ]);

          // for (const item of aggregation) {
          //   switch (item._id) {
          //     case "Viewed":
          //       viewedCount = item.count;
          //       break;
          //     case "Shortlisted":
          //       shortlistedCount = item.count;
          //       break;
          //     case "Rejected":
          //       rejectedCount = item.count;
          //       break;
          //     case "Hold":
          //       holdCount = item.count;
          //       break;
          //   }
          // }

          // --------------------------------------------------
          // --------------------------------------------------
          // ---------------  THIS IS CORRECT  ----------------
          // ---------------  SALARY FILTER    ----------------
          // --------------------------------------------------
          // --------------------------------------------------
          // Salary filter
          if (typeof salaryMin === "number" || typeof salaryMax === "number") {
            const salaryFilter = [];

            if (typeof salaryMin === "number") {
              salaryFilter.push({
                $or: [
                  { "jobPreferences.currentSalary": { $gte: salaryMin } },
                  { "jobPreferences.expectedSalary": { $gte: salaryMin } },
                ],
              });
            }

            if (typeof salaryMax === "number") {
              salaryFilter.push({
                $or: [
                  { "jobPreferences.currentSalary": { $lte: salaryMax } },
                  { "jobPreferences.expectedSalary": { $lte: salaryMax } },
                ],
              });
            }

            // Combine salary filters with $and
            if (salaryFilter.length > 0) {
              baseFilters.$and = baseFilters.$and
                ? [...baseFilters.$and, ...salaryFilter]
                : salaryFilter;
            }
          }

          // const totalCandidates = await Candidate.countDocuments(filters);

          // Step 2: Count stats using only base filters (no status filter)
          let viewedCount = 0;
          let shortlistedCount = 0;
          let rejectedCount = 0;
          let holdCount = 0;
          let totalCount = 0;

          if (employerId) {
            const aggregation = await Candidate.aggregate([
              { $match: baseFilters },
              { $unwind: "$statusBy" },
              {
                $match: {
                  "statusBy.recruiter": new mongoose.Types.ObjectId(employerId),
                },
              },
              {
                $group: {
                  _id: "$statusBy.status",
                  count: { $sum: 1 },
                },
              },
            ]);

            for (const item of aggregation) {
              totalCount += item.count;
              switch (item._id) {
                case "Viewed":
                  viewedCount = item.count;
                  break;
                case "Shortlisted":
                  shortlistedCount = item.count;
                  break;
                case "Rejected":
                  rejectedCount = item.count;
                  break;
                case "Hold":
                  holdCount = item.count;
                  break;
              }
            }
          } else {
            totalCount = await Candidate.countDocuments(baseFilters);
          }

          // Step 3: Apply status filter for pagination query only
          const paginatedFilters = { ...baseFilters };

          if (employerId && isStringFilled(status)) {
            const recruiterStatusFilter = {
              statusBy: {
                $elemMatch: {
                  recruiter: employerId,
                  status: new RegExp(`^${status}$`, "i"),
                },
              },
            };

            paginatedFilters.$and = paginatedFilters.$and
              ? [...paginatedFilters.$and, recruiterStatusFilter]
              : [recruiterStatusFilter];
          }

          const totalCandidates = await Candidate.countDocuments(
            paginatedFilters
          );

          const candidates = await Candidate.find(paginatedFilters)
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
              updatedAt: c.updatedAt,
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
            totalCount,
            viewedCount,
            shortlistedCount,
            rejectedCount,
            holdCount,
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
        status: { type: GraphQLString }, // this will also accept "email", "phone", "whatsapp"
        recruiterId: { type: GraphQLID },
      },
      async resolve(_, { candidateId, status, recruiterId }) {
        try {
          const candidateExists = await Candidate.exists({ _id: candidateId });
          const employerExists = await Employer.exists({ _id: recruiterId });

          if (!candidateExists || !employerExists) {
            return {
              success: false,
              message: "Candidate or employer not found.",
            };
          }

          const lowerStatus = status.toLowerCase();

          const contactActions = ["email", "phone", "whatsapp"];
          const validStatuses = [
            "Pending",
            "Viewed",
            "Hold",
            "Shortlisted",
            "Rejected",
            "Hired",
          ];

          const viewResult = await handleResumeView(recruiterId, candidateId);
          if (!viewResult.success) return viewResult;

          const formattedStatus = contactActions.includes(lowerStatus)
            ? "Viewed"
            : status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

          if (!validStatuses.includes(formattedStatus)) {
            return {
              success: false,
              message: `Invalid status: ${status}. Valid statuses are ${validStatuses.join(
                ", "
              )}.`,
            };
          }

          // Atomic update: try to update existing recruiter status in statusBy array and jobs.appliedJobs statuses
          const arrayFilters = [{ "job.status": "Pending" }];

          const updateResult = await Candidate.updateOne(
            { _id: candidateId, "statusBy.recruiter": recruiterId },
            {
              $set: {
                "statusBy.$.status": formattedStatus,
                "statusBy.$.date": new Date(),
                "jobs.appliedJobs.$[job].status": formattedStatus,
              },
            },
            { arrayFilters }
          );

          // If recruiter entry does not exist, push new statusBy entry and update job statuses
          if (updateResult.matchedCount === 0) {
            await Candidate.updateOne(
              { _id: candidateId },
              {
                $push: {
                  statusBy: {
                    recruiter: recruiterId,
                    status: formattedStatus,
                    date: new Date(),
                  },
                },
                $set: {
                  "jobs.appliedJobs.$[job].status": formattedStatus,
                },
              },
              { arrayFilters }
            );
          }

          return {
            success: true,
            message: `Status updated to ${formattedStatus}.`,
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

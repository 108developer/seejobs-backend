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
import Application from "../models/jobs/application.js";
import JobListing from "../models/jobs/jobsModel.js";
import { handleResumeView } from "../utils/handleResumeAccess.js";

function calculateAge(dob) {
  const diff = Date.now() - dob.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

function formatAnswer(answer) {
  if (Array.isArray(answer)) {
    return answer.join(", ");
  }
  if (answer === null || answer === undefined) {
    return "";
  }
  return answer.toString();
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

const JobApplicationType = new GraphQLObjectType({
  name: "JobApplication",
  fields: {
    id: { type: GraphQLID },
    recruiterId: { type: GraphQLID },
    candidateId: { type: GraphQLID },
    fullName: { type: GraphQLString },
    email: { type: GraphQLString },
    phone: { type: GraphQLString },
    jobTitle: { type: GraphQLString },
    jobRole: { type: GraphQLString },
    skills: { type: new GraphQLList(GraphQLString) },
    location: { type: GraphQLString },
    salary: { type: GraphQLFloat },
    experience: { type: GraphQLInt },
    degree: { type: GraphQLString },
    board: { type: GraphQLString },
    medium: { type: GraphQLString },
    mode: { type: GraphQLString },
    gender: { type: GraphQLString },
    age: { type: GraphQLInt },
    currentSalary: { type: GraphQLFloat },
    expectedSalary: { type: GraphQLFloat },
    matchedSkills: { type: new GraphQLList(GraphQLString) },
    unmatchedSkills: { type: new GraphQLList(GraphQLString) },
    matchedSkillsCount: { type: GraphQLInt },
    answers: {
      type: new GraphQLList(
        new GraphQLObjectType({
          name: "QuestionAnswer",
          fields: {
            questionId: { type: GraphQLID },
            questionText: { type: GraphQLString },
            answer: { type: GraphQLString },
          },
        })
      ),
    },
    profilePic: { type: GraphQLString },
    resume: { type: GraphQLString },
    attachedDocument: { type: GraphQLString },
    appliedAt: { type: GraphQLString },
    status: { type: GraphQLString },
    numberOfRecruitersShortlisted: { type: GraphQLInt },
  },
});

const RootQuery = new GraphQLObjectType({
  name: "RootQueryType",
  fields: {
    getJobApplications: {
      type: new GraphQLObjectType({
        name: "JobApplicationResponse",
        fields: {
          success: { type: GraphQLBoolean },
          message: { type: GraphQLString },
          totalApplications: { type: GraphQLInt },
          currentPage: { type: GraphQLInt },
          totalPages: { type: GraphQLInt },
          jobApplications: { type: new GraphQLList(JobApplicationType) },
          shortlistedCount: { type: GraphQLInt },
          viewedCount: { type: GraphQLInt },
          rejectedCount: { type: GraphQLInt },
          holdCount: { type: GraphQLInt },
        },
      }),
      args: {
        recruiterId: { type: GraphQLID },
        jobId: { type: GraphQLID },
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
        const {
          recruiterId,
          jobId,
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
          status,
          ageMax,
          freshness,
          page = 1,
          limit = 10,
        } = args;

        if (!mongoose.Types.ObjectId.isValid(jobId)) {
          return {
            success: false,
            message: "Invalid job ID",
            jobApplications: [],
          };
        }

        let viewedCount = 0;
        let shortlistedCount = 0;
        let rejectedCount = 0;
        let holdCount = 0;

        try {
          const filters = [];

          filters.push({ job: new mongoose.Types.ObjectId(jobId) });

          if (freshness) {
            const freshnessFilter = getFreshnessFilter(freshness);
            if (freshnessFilter) {
              filters.push({ updatedAt: freshnessFilter });
            }
          }

          const isNonEmpty = (val) => Array.isArray(val) && val.length > 0;
          const isStringFilled = (str) =>
            typeof str === "string" && str.trim().length > 0;

          if (isStringFilled(status)) {
            filters.push({
              status: status,
            });
          }

          if (Array.isArray(skills) && skills.length > 0) {
            const filtersForSkillsAndTitles = [];

            for (const keyword of skills) {
              if (typeof keyword === "string" && keyword.trim() !== "") {
                const regex = new RegExp(keyword.trim(), "i");

                filtersForSkillsAndTitles.push(
                  { "candidate.registration.skills": { $in: [regex] } },
                  {
                    "candidate.jobPreferences.profileTitle": { $regex: regex },
                  },
                  { "candidate.workExperience.jobTitle": { $regex: regex } }
                );
              }
            }

            if (filtersForSkillsAndTitles.length > 0) {
              filters.push({ $or: filtersForSkillsAndTitles });
            }
          }

          // if (isNonEmpty(skills)) {
          //   filters.push({
          //     "candidate.registration.skills": { $in: skills },
          //   });
          // }

          // if (isStringFilled(jobTitle)) {
          //   filters.push({
          //     "candidate.jobPreferences.profileTitle": {
          //       $regex: jobTitle,
          //       $options: "i",
          //     },
          //   });
          // }

          // if (Array.isArray(skills) && skills.length > 0) {
          //   const skillNames = skills
          //     .filter((s) => s.type === "Skill")
          //     .map((s) => s.name);
          //   const jobTitles = skills
          //     .filter((s) => s.type === "JobTitle")
          //     .map((s) => s.name);

          //   if (skillNames.length > 0) {
          //     filters.push({
          //       "candidate.registration.skills": { $in: skillNames },
          //     });
          //   }

          //   if (jobTitles.length > 0) {
          //     filters.push({
          //       "candidate.jobPreferences.profileTitle": { $in: jobTitles },
          //     });
          //   }
          // }

          if (isStringFilled(location)) {
            filters.push({
              "candidate.registration.location": {
                $regex: location,
                $options: "i",
              },
            });
          }

          if (isStringFilled(jobRole)) {
            filters.push({
              "candidate.jobPreferences.jobRole": {
                $regex: jobRole,
                $options: "i",
              },
            });
          }

          if (isNonEmpty(jobTypes)) {
            filters.push({
              "candidate.jobPreferences.jobType": { $in: jobTypes },
            });
          }

          if (isStringFilled(degree)) {
            filters.push({
              "candidate.candidateEducation.highestQualification": degree,
            });
          }

          if (isStringFilled(gender)) {
            filters.push({ "candidate.jobPreferences.gender": gender });
          }

          if (experienceMin || experienceMax) {
            const range = {};
            if (experienceMin >= 0) range.$gte = experienceMin;
            if (experienceMax <= 50) range.$lte = experienceMax;

            filters.push({ "candidate.registration.maxexp": range });
          }

          if (ageMin || ageMax) {
            const ageRange = {};
            if (ageMin >= 0) ageRange.$gte = ageMin;
            if (ageMax <= 100) ageRange.$lte = ageMax;

            filters.push({ "candidate.jobPreferences.age": ageRange });
          }

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
                  {
                    "candidate.jobPreferences.currentSalary": {
                      $gte: salaryMin,
                    },
                  },
                  {
                    "candidate.jobPreferences.expectedSalary": {
                      $gte: salaryMin,
                    },
                  },
                ],
              });
            }

            if (typeof salaryMax === "number") {
              salaryFilter.push({
                $or: [
                  {
                    "candidate.jobPreferences.currentSalary": {
                      $lte: salaryMax,
                    },
                  },
                  {
                    "candidate.jobPreferences.expectedSalary": {
                      $lte: salaryMax,
                    },
                  },
                ],
              });
            }

            if (salaryFilter.length > 0) {
              filters.push(...salaryFilter);
            }
          }

          if (mongoose.Types.ObjectId.isValid(jobId)) {
            const statusAggregationFilters = [
              { job: new mongoose.Types.ObjectId(jobId) },
            ];

            // ❗ Uncomment the below only if recruiter is stored in Application documents
            // if (recruiterId && mongoose.Types.ObjectId.isValid(recruiterId)) {
            //   statusAggregationFilters.push({
            //     recruiter: new mongoose.Types.ObjectId(recruiterId),
            //   });
            // }

            const aggregation = await Application.aggregate([
              { $match: { $and: statusAggregationFilters } },
              {
                $group: {
                  _id: {
                    $toLower: {
                      $ifNull: [{ $toString: "$status" }, ""],
                    },
                  },
                  count: { $sum: 1 },
                },
              },
            ]);

            for (const item of aggregation) {
              switch (item._id) {
                case "viewed":
                  viewedCount = item.count;
                  break;
                case "shortlisted":
                  shortlistedCount = item.count;
                  break;
                case "rejected":
                  rejectedCount = item.count;
                  break;
                case "hold":
                  holdCount = item.count;
                  break;
              }
            }
          }

          // const salaryConditions = [];
          // if (salaryMin) {
          //   filters.push({
          //     $or: [
          //       {
          //         "candidate.jobPreferences.currentSalary": {
          //           $lt: salaryMin,
          //         },
          //       },
          //       {
          //         "candidate.jobPreferences.expectedSalary": {
          //           $lt: salaryMin,
          //         },
          //       },
          //     ],
          //   });
          // }

          // if (salaryMax) {
          //   salaryConditions.push({
          //     "candidate.jobPreferences.currentSalary": { $lte: salaryMax },
          //   });
          //   salaryConditions.push({
          //     "candidate.jobPreferences.expectedSalary": { $lte: salaryMax },
          //   });
          // }

          // if (salaryConditions.length) {
          //   filters.push({ $and: salaryConditions });
          // }

          const basePipeline = [
            { $match: { job: new mongoose.Types.ObjectId(jobId) } },
            {
              $lookup: {
                from: "candidates",
                localField: "candidate",
                foreignField: "_id",
                as: "candidate",
              },
            },
            {
              $unwind: {
                path: "$candidate",
                preserveNullAndEmptyArrays: true,
              },
            },

            // {
            //   $lookup: {
            //     from: "answers",
            //     localField: "answers",
            //     foreignField: "_id",
            //     as: "answers",
            //   },
            // },
          ];

          if (filters.length) {
            basePipeline.push({ $match: { $and: filters } });
          }

          const pipelineWithFacet = [
            ...basePipeline,
            { $sort: { appliedAt: -1 } },
            {
              $facet: {
                paginatedResults: [
                  { $skip: (page - 1) * limit },
                  { $limit: limit },
                ],
                totalCount: [{ $count: "count" }],
              },
            },
          ];

          const jobListing = await JobListing.findById(jobId);
          if (!jobListing) {
            return {
              success: false,
              message: "Job not found",
              jobApplications: [],
            };
          }

          const result = await Application.aggregate(pipelineWithFacet);
          const applications = result[0].paginatedResults;
          const totalCount = result[0].totalCount[0]?.count || 0;

          const enrichedJobApplications = applications.map((application) => {
            const c = application.candidate;
            const candidateSkills = c?.registration?.skills || [];
            const inputSkills = Array.isArray(skills) ? skills : [];
            const matchedSkills = inputSkills.filter((skill) =>
              candidateSkills.includes(skill)
            );
            const unmatchedSkills = inputSkills.filter(
              (skill) => !candidateSkills.includes(skill)
            );
            const dob = c?.jobPreferences?.dob;
            const age = dob ? calculateAge(new Date(dob)) : null;

            const answers = (application.answers || []).map((answer) => {
              const question = jobListing.questions.find(
                (q) => q._id.toString() === answer.questionId.toString()
              );

              return {
                questionId: answer.questionId,
                questionText: question
                  ? question.questionText
                  : "Unknown Question",
                answer: formatAnswer(answer.answer),
              };
            });

            const numberOfRecruitersShortlisted = c.jobs.shortlistedBy.length;

            return {
              id: application._id,
              candidateId: c._id,
              fullName: c.registration.fullName,
              email: c.registration.email,
              phone: c.registration.phone,
              jobTitle: c.jobPreferences.profileTitle,
              jobRole: Array.isArray(c.jobPreferences.jobRoles)
                ? c.jobPreferences.jobRoles[0]
                : c.jobPreferences.jobRoles,
              location: c.registration.location,
              experience: c.registration.maxexp,
              degree: c.candidateEducation?.highestQualification,
              gender: c.jobPreferences.gender,
              age,
              currentSalary: c.jobPreferences.currentSalary || null,
              expectedSalary: c.jobPreferences.expectedSalary || null,
              matchedSkills,
              unmatchedSkills,
              matchedSkillsCount: matchedSkills.length,
              skills: c.registration.skills,
              profilePic: c.jobPreferences.profilePic,
              resume: c.registration.resume,
              board: c.candidateEducation?.boardOfEducation,
              medium: c.candidateEducation?.medium,
              mode: c.candidateEducation?.educationMode,
              appliedAt: application.appliedAt,
              status: application.status,
              updatedAt: c.updatedAt,
              answers,
              numberOfRecruitersShortlisted,
            };
          });

          const sortedJobApplications = isNonEmpty(skills)
            ? enrichedJobApplications.sort(
                (a, b) => b.matchedSkillsCount - a.matchedSkillsCount
              )
            : enrichedJobApplications;

          return {
            success: true,
            message: "Job applications retrieved successfully",
            totalApplications: totalCount,
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            shortlistedCount,
            viewedCount,
            rejectedCount,
            holdCount,
            jobApplications: sortedJobApplications,
          };
        } catch (err) {
          console.error("Error fetching job applications:", err);
          return {
            success: false,
            message: err.message,
            jobApplications: [],
          };
        }
      },
    },
  },
});

const RootMutation = new GraphQLObjectType({
  name: "Mutation",
  fields: {
    updateJobApplicationStatus: {
      type: new GraphQLObjectType({
        name: "UpdateStatusResponse",
        fields: {
          success: { type: GraphQLBoolean },
          message: { type: GraphQLString },
        },
      }),
      args: {
        applicationId: { type: GraphQLID },
        status: { type: GraphQLString },
        recruiterId: { type: GraphQLID },
      },
      async resolve(_, { applicationId, status, recruiterId }) {
        try {
          const contactActions = ["email", "phone", "whatsapp"];
          const validStatuses = [
            "Pending",
            "Viewed",
            "Hold",
            "Shortlisted",
            "Rejected",
            "Hired",
          ];

          const application = await Application.findById(applicationId);
          const employer = await Employer.exists({ _id: recruiterId });

          if (!application || !employer) {
            return {
              success: false,
              message: "Application or employer not found.",
            };
          }

          const candidateId = application.candidate;
          const candidateExists = await Candidate.exists({ _id: candidateId });
          if (!candidateExists) {
            return {
              success: false,
              message: "Candidate not found.",
            };
          }

          // Deduct view
          const viewResult = await handleResumeView(recruiterId, candidateId);
          if (!viewResult.success) return viewResult;

          const lowerStatus = status.toLowerCase();
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

          // Update Application status
          await Application.updateOne(
            { _id: applicationId },
            { $set: { status: formattedStatus } }
          );

          // Update candidate.statusBy and jobs.appliedJobs using atomic update
          const arrayFilters = [
            { "job.job": application.job, "job.status": "Pending" },
          ];

          const update = {
            $set: {
              "jobs.appliedJobs.$[job].status": formattedStatus,
            },
          };

          // Add statusBy update or push if not exists
          const candidateDoc = await Candidate.findById(candidateId);
          const hasRecruiterStatus = candidateDoc.statusBy.some(
            (entry) => entry.recruiter.toString() === recruiterId
          );

          if (hasRecruiterStatus) {
            update.$set["statusBy.$[status]"] = {
              status: formattedStatus,
              date: new Date(),
            };
            arrayFilters.push({ "status.recruiter": recruiterId });
          } else {
            update.$push = {
              statusBy: {
                recruiter: recruiterId,
                status: formattedStatus,
                date: new Date(),
              },
            };
          }

          // Handle shortlist push (if needed)
          if (formattedStatus === "Shortlisted") {
            update.$push = {
              ...(update.$push || {}),
              "jobs.shortlistedBy": {
                recruiter: recruiterId,
                job: application.job,
                date: new Date(),
              },
            };
          }

          await Candidate.updateOne({ _id: candidateId }, update, {
            arrayFilters,
          });

          const contactRevealMessage = contactActions.includes(lowerStatus)
            ? `Contact (${lowerStatus}) revealed and `
            : "";

          return {
            success: true,
            message: `${contactRevealMessage}Application status updated to ${formattedStatus}.`,
          };
        } catch (error) {
          console.error("Error updating job application status:", error);
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

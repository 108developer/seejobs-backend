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
import Application from "../models/jobs/application.js";
import JobListing from "../models/jobs/jobsModel.js";

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

const JobApplicationType = new GraphQLObjectType({
  name: "JobApplication",
  fields: {
    id: { type: GraphQLID },
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
        },
      }),
      args: {
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
        page: { type: GraphQLInt },
        limit: { type: GraphQLInt },
      },
      async resolve(_, args) {
        const {
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

        try {
          const filters = [];

          filters.push({ job: new mongoose.Types.ObjectId(jobId) });

          const isNonEmpty = (val) => Array.isArray(val) && val.length > 0;
          const isStringFilled = (str) =>
            typeof str === "string" && str.trim().length > 0;

          if (isStringFilled(status)) {
            filters.push({
              status: status,
            });
          }

          if (isNonEmpty(skills)) {
            filters.push({
              "candidate.registration.skills": { $in: skills },
            });
          }

          if (isStringFilled(location)) {
            filters.push({
              "candidate.registration.location": {
                $regex: location,
                $options: "i",
              },
            });
          }

          if (isStringFilled(jobTitle)) {
            filters.push({
              "candidate.jobPreferences.profileTitle": {
                $regex: jobTitle,
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

          const salaryConditions = [];
          if (salaryMin) {
            filters.push({
              $or: [
                {
                  "candidate.jobPreferences.currentSalary": {
                    $lt: salaryMin,
                  },
                },
                {
                  "candidate.jobPreferences.expectedSalary": {
                    $lt: salaryMin,
                  },
                },
              ],
            });
          }

          if (salaryMax) {
            salaryConditions.push({
              "candidate.jobPreferences.currentSalary": { $lte: salaryMax },
            });
            salaryConditions.push({
              "candidate.jobPreferences.expectedSalary": { $lte: salaryMax },
            });
          }

          if (salaryConditions.length) {
            filters.push({ $and: salaryConditions });
          }

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
            { $unwind: "$candidate" },
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

          const application = await Application.findById(applicationId);

          if (!application) {
            return {
              success: false,
              message: "Application not found.",
            };
          }

          const candidate = await Candidate.findById(application.candidate);
          if (!candidate) {
            return {
              success: false,
              message: "Candidate not found.",
            };
          }

          const appliedJob = candidate.jobs.appliedJobs.find(
            (job) => job.job.toString() === application.job.toString()
          );

          if (!appliedJob) {
            return {
              success: false,
              message: "Job application not found in candidate's applied jobs.",
            };
          }

          appliedJob.status = formattedStatus;

          if (formattedStatus === "Shortlisted" && recruiterId) {
            candidate.jobs.shortlistedBy.push({
              recruiter: recruiterId,
              job: application.job,
              date: new Date(),
            });
          }

          await candidate.save();
          application.status = formattedStatus;
          await application.save();

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

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
        page: { type: GraphQLInt },
        limit: { type: GraphQLInt },
      },
      async resolve(_, args) {
        try {
          const {
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
            page = 1,
            limit = 10,
          } = args;

          const filters = {};

          const isNonEmpty = (val) => Array.isArray(val) && val.length > 0;
          const isStringFilled = (str) =>
            typeof str === "string" && str.trim().length > 0;

          if (isNonEmpty(skills)) {
            filters["registration.skills"] = { $in: skills };
          }

          if (isStringFilled(location)) {
            filters["registration.location"] = {
              $regex: location,
              $options: "i",
            };
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

          if (
            (salaryMin && salaryMin >= 0) ||
            (salaryMax && salaryMax <= 5000000)
          ) {
            filters["$and"] = [];

            if (salaryMin && salaryMax) {
              filters["$and"].push(
                {
                  "jobPreferences.currentSalary": {
                    $gte: salaryMin,
                    $lte: salaryMax,
                  },
                },
                {
                  "jobPreferences.expectedSalary": {
                    $gte: salaryMin,
                    $lte: salaryMax,
                  },
                }
              );
            } else if (salaryMin) {
              filters["$and"].push(
                { "jobPreferences.currentSalary": { $gte: salaryMin } },
                { "jobPreferences.expectedSalary": { $gte: salaryMin } }
              );
            } else if (salaryMax) {
              filters["$and"].push(
                { "jobPreferences.currentSalary": { $lte: salaryMax } },
                { "jobPreferences.expectedSalary": { $lte: salaryMax } }
              );
            }
          }

          if (
            (experienceMin && experienceMin >= 0) ||
            (experienceMax && experienceMax <= 50)
          ) {
            filters["registration.maxexp"] = {};
            if (experienceMin && experienceMin >= 0)
              filters["registration.maxexp"].$gte = experienceMin;
            if (experienceMax && experienceMax <= 50)
              filters["registration.maxexp"].$lte = experienceMax;
          }

          if ((ageMin && ageMin >= 0) || (ageMax && ageMax <= 100)) {
            const ageRange = {};
            if (ageMin && ageMin >= 0) ageRange.$gte = ageMin;
            if (ageMax && ageMax <= 100) ageRange.$lte = ageMax;

            filters["jobPreferences.age"] = ageRange;
          }

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

            return {
              id: c._id,
              name: c.registration.fullName,
              email: c.registration.email,
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

const schema = new GraphQLSchema({
  query: RootQuery,
});

export default schema;

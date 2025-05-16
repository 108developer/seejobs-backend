// graphql/queriesFilterSchema.js

import {
  GraphQLID,
  GraphQLList,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from "graphql";
import Degree from "../models/queriesFilter/degreeModel.js";
import JobRole from "../models/queriesFilter/jobRoleModel.js";
import JobTitle from "../models/queriesFilter/jobTitleModel.js";
import JobType from "../models/queriesFilter/jobTypeModel.js";
import Medium from "../models/queriesFilter/mediumModel.js";
import PercentageRange from "../models/queriesFilter/percentageRangeModel.js";
import Skill from "../models/queriesFilter/skillModel.js";

// Define GraphQL types
const SkillType = new GraphQLObjectType({
  name: "Skill",
  fields: {
    _id: { type: GraphQLID },
    name: { type: GraphQLString },
  },
});

const JobTitleType = new GraphQLObjectType({
  name: "JobTitle",
  fields: {
    _id: { type: GraphQLID },
    value: { type: GraphQLString },
    label: { type: GraphQLString },
  },
});

const DegreeType = new GraphQLObjectType({
  name: "Degree",
  fields: {
    _id: { type: GraphQLID },
    value: { type: GraphQLString },
    label: { type: GraphQLString },
  },
});

const MediumType = new GraphQLObjectType({
  name: "Medium",
  fields: {
    _id: { type: GraphQLID },
    name: { type: GraphQLString },
  },
});

const PercentageRangeType = new GraphQLObjectType({
  name: "PercentageRange",
  fields: {
    _id: { type: GraphQLID },
    value: { type: GraphQLString },
    label: { type: GraphQLString },
  },
});

const JobTypeType = new GraphQLObjectType({
  name: "JobType",
  fields: {
    _id: { type: GraphQLID },
    value: { type: GraphQLString },
    label: { type: GraphQLString },
  },
});

const JobRoleType = new GraphQLObjectType({
  name: "JobRole",
  fields: {
    _id: { type: GraphQLID },
    value: { type: GraphQLString },
    label: { type: GraphQLString },
  },
});

// Define queries
const RootQuery = new GraphQLObjectType({
  name: "RootQueryType",
  fields: {
    getJobTypes: {
      type: new GraphQLList(JobTypeType),
      resolve(parent, args) {
        return JobType.find();
      },
    },
    getJobTitle: {
      type: new GraphQLList(JobTitleType),
      resolve(parent, args) {
        return JobTitle.find();
      },
    },
    getJobRole: {
      type: new GraphQLList(JobRoleType),
      resolve(parent, args) {
        return JobRole.find();
      },
    },
    getDegree: {
      type: new GraphQLList(DegreeType),
      resolve(parent, args) {
        return Degree.find();
      },
    },
    searchSkills: {
      type: new GraphQLList(SkillType),
      args: { query: { type: GraphQLString } },
      resolve(parent, args) {
        const { query } = args;
        if (query) {
          return Skill.find({
            name: { $regex: query, $options: "i" },
          });
        } else {
          return Skill.find();
        }
      },
    },
    jobTitles: {
      type: new GraphQLList(JobTitleType),
      args: { searchTerm: { type: GraphQLString } },
      resolve(parent, args) {
        const { searchTerm } = args;
        const query = searchTerm
          ? {
              $or: [
                { value: { $regex: searchTerm, $options: "i" } },
                { label: { $regex: searchTerm, $options: "i" } },
              ],
            }
          : {};

        return JobTitle.find(query).limit(20);
      },
    },
    searchJobTitles: {
      type: new GraphQLList(JobTitleType),
      args: { query: { type: GraphQLString } },
      resolve(parent, args) {
        const { query } = args;
        if (query) {
          return JobTitle.find({
            $or: [
              { value: { $regex: query, $options: "i" } },
              { label: { $regex: query, $options: "i" } },
            ],
          });
        } else {
          return JobTitle.find();
        }
      },
    },
    searchJobRoles: {
      type: new GraphQLList(JobRoleType),
      args: { query: { type: GraphQLString } },
      resolve(parent, args) {
        const { query } = args;
        if (query) {
          return JobRole.find({
            $or: [
              { value: { $regex: query, $options: "i" } },
              { label: { $regex: query, $options: "i" } },
            ],
          });
        } else {
          return JobRole.find();
        }
      },
    },
    searchDegrees: {
      type: new GraphQLList(DegreeType),
      args: { query: { type: GraphQLString } },
      resolve(parent, args) {
        const { query } = args;
        if (query) {
          return Degree.find({
            $or: [
              { value: { $regex: query, $options: "i" } },
              { label: { $regex: query, $options: "i" } },
            ],
          });
        } else {
          return Degree.find();
        }
      },
    },
    searchMedium: {
      type: new GraphQLList(MediumType),
      args: { query: { type: GraphQLString } },
      resolve(parent, args) {
        const { query } = args;
        if (query) {
          return Medium.find({
            name: { $regex: args.query, $options: "i" },
          });
        } else {
          return Medium.find();
        }
      },
    },
    searchPercentageRange: {
      type: new GraphQLList(PercentageRangeType),
      args: { query: { type: GraphQLString } },
      resolve(parent, args) {
        const { query } = args;
        if (query) {
          return PercentageRange.find({
            value: { $regex: args.query, $options: "i" },
          });
        } else {
          return PercentageRange.find();
        }
      },
    },
    searchJobTypes: {
      type: new GraphQLList(JobTypeType),
      args: { query: { type: GraphQLString } },
      resolve(parent, args) {
        const { query } = args;
        if (query) {
          return JobType.find({
            value: { $regex: args.query, $options: "i" },
          });
        } else {
          return JobType.find();
        }
      },
    },
  },
});

// Define mutations
const Mutation = new GraphQLObjectType({
  name: "Mutation",
  fields: {
    createSkill: {
      type: SkillType,
      args: { name: { type: GraphQLString } },
      resolve(parent, args) {
        const newSkill = new Skill({ name: args.name });
        return newSkill.save();
      },
    },
    createJobTitle: {
      type: JobTitleType,
      args: { name: { type: GraphQLString } },
      resolve(parent, args) {
        const newJobTitle = new JobTitle({
          value: args.name,
          label: args.name,
        });
        return newJobTitle.save();
      },
    },
    createDegree: {
      type: DegreeType,
      args: { name: { type: GraphQLString } },
      resolve(parent, args) {
        const newDegree = new Degree({ value: args.name, label: args.name });
        return newDegree.save();
      },
    },
    createMedium: {
      type: MediumType,
      args: { name: { type: GraphQLString } },
      resolve(parent, args) {
        const newMedium = new Medium({ name: args.name });
        return newMedium.save();
      },
    },
    createPercentageRange: {
      type: PercentageRangeType,
      args: { name: { type: GraphQLString } },
      resolve(parent, args) {
        const newPercentageRange = new PercentageRange({
          value: args.name,
          label: args.name,
        });
        return newPercentageRange.save();
      },
    },
    createJobType: {
      type: JobTypeType,
      args: { name: { type: GraphQLString } },
      resolve(parent, args) {
        const newJobType = new JobType({ value: args.name, label: args.name });
        return newJobType.save();
      },
    },
  },
});

// Create schema
const schema = new GraphQLSchema({
  query: RootQuery,
  mutation: Mutation,
});

export default schema;

// backend/graphql/industriesSchema.js
import {
  GraphQLList,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from "graphql";
import Industry from "../models/queriesFilter/industriesModel.js";

// Define the Industry type for GraphQL
const IndustryType = new GraphQLObjectType({
  name: "Industry",
  fields: () => ({
    _id: { type: GraphQLString },
    uniqueId: { type: GraphQLString },
    name: { type: GraphQLString },
    description: { type: GraphQLString },
  }),
});

// Query for fetching all industries (filtered by a search string)
const RootQuery = new GraphQLObjectType({
  name: "RootQueryType",
  fields: {
    industries: {
      type: new GraphQLList(IndustryType),
      args: { searchTerm: { type: GraphQLString } },
      resolve(parent, args) {
        const { searchTerm } = args;
        if (searchTerm) {
          return Industry.find({
            $or: [
              { uniqueId: { $regex: searchTerm, $options: "i" } },
              { name: { $regex: searchTerm, $options: "i" } },
              { description: { $regex: searchTerm, $options: "i" } },
            ],
          });
        } else {
          return Industry.find();
        }
      },
    },
  },
});

// Mutation for creating a new Industry
const Mutation = new GraphQLObjectType({
  name: "Mutation",
  fields: {
    addIndustry: {
      type: IndustryType,
      args: {
        uniqueId: { type: GraphQLString },
        name: { type: GraphQLString },
        description: { type: GraphQLString },
      },
      resolve(parent, args) {
        const industry = new Industry({
          uniqueId: args.uniqueId,
          name: args.name,
          description: args.description,
        });
        return industry.save();
      },
    },
  },
});

// Export the complete GraphQL schema
export default new GraphQLSchema({
  query: RootQuery,
  mutation: Mutation,
});

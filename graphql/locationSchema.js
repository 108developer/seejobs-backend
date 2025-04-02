import {
  GraphQLList,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from "graphql";
import Location from "../models/queriesFilter/locationModel.js";

// Define the Location type for GraphQL
const LocationType = new GraphQLObjectType({
  name: "Location",
  fields: () => ({
    _id: { type: GraphQLString },
    locality: { type: GraphQLString },
    city: { type: GraphQLString },
    state: { type: GraphQLString },
    country: { type: GraphQLString },
    pinCode: { type: GraphQLString },
    fullAddress: {
      type: GraphQLString,
      resolve(parent) {
        return `${parent.locality}, ${parent.city}, ${parent.state}, ${parent.country} - ${parent.pinCode}`;
      },
    },
  }),
});

// Query for fetching all locations (filtered by a search string)
const RootQuery = new GraphQLObjectType({
  name: "RootQueryType",
  fields: {
    locations: {
      type: new GraphQLList(LocationType),
      args: { searchTerm: { type: GraphQLString } },
      resolve(parent, args) {
        const { searchTerm } = args;
        if (searchTerm) {
          return Location.find({
            $or: [
              { locality: { $regex: searchTerm, $options: "i" } },
              { city: { $regex: searchTerm, $options: "i" } },
              { state: { $regex: searchTerm, $options: "i" } },
              { country: { $regex: searchTerm, $options: "i" } },
              { pinCode: { $regex: searchTerm, $options: "i" } },
            ],
          });
        } else {
          return Location.find();
        }
      },
    },
  },
});

// Mutation for creating a new location
const Mutation = new GraphQLObjectType({
  name: "Mutation",
  fields: {
    addLocation: {
      type: LocationType,
      args: {
        locality: { type: GraphQLString },
        city: { type: GraphQLString },
        state: { type: GraphQLString },
        country: { type: GraphQLString },
        pinCode: { type: GraphQLString },
      },
      resolve(parent, args) {
        const location = new Location({
          locality: args.locality,
          city: args.city,
          state: args.state,
          country: args.country,
          pinCode: args.pinCode,
        });
        return location.save();
      },
    },
  },
});

// Export the complete GraphQL schema
export default new GraphQLSchema({
  query: RootQuery,
  mutation: Mutation,
});

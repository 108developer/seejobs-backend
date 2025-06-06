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
    cityStateCountry: {
      type: new GraphQLList(LocationType),
      args: { searchTerm: { type: GraphQLString } },
      resolve(parent, args) {
        const { searchTerm } = args;

        if (searchTerm) {
          return Location.aggregate([
            {
              $match: {
                $or: [
                  { city: { $regex: searchTerm, $options: "i" } },
                  { state: { $regex: searchTerm, $options: "i" } },
                  { country: { $regex: searchTerm, $options: "i" } },
                ],
              },
            },
            {
              $group: {
                _id: {
                  $concat: ["$city", ", ", "$state", ", ", "$country"], // Concatenate city, state, and country into a single string
                },
                city: { $first: "$city" },
                state: { $first: "$state" },
                country: { $first: "$country" },
              },
            },
            { $sort: { city: 1 } }, // Optionally sort the result
          ]).limit(20);
        } else {
          return Location.aggregate([
            {
              $group: {
                _id: {
                  $concat: ["$city", ", ", "$state", ", ", "$country"], // Concatenate city, state, and country into a single string
                },
                city: { $first: "$city" },
                state: { $first: "$state" },
                country: { $first: "$country" },
              },
            },
            { $sort: { city: 1 } },
          ]).limit(20);
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

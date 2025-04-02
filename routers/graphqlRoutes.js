// backend/graphql/graphqlRoutes.js
import { Router } from "express";
import { graphqlHTTP } from "express-graphql";
import locationSchema from "../graphql/locationSchema.js";
import industriesSchema from "../graphql/industriesSchema.js";

const router = Router();

// GraphQL route for Locations
router.use("/locations", (req, res, next) => {
  const searchTerm = req.query.searchTerm || "";
  graphqlHTTP({
    schema: locationSchema,
    graphiql: true,
    context: { searchTerm },
  })(req, res, next);
});

// GraphQL route for Industries
router.use("/industries", (req, res, next) => {
  const searchTerm = req.query.searchTerm || "";
  graphqlHTTP({
    schema: industriesSchema,
    graphiql: true,
    context: { searchTerm },
  })(req, res, next);
});

export default router;

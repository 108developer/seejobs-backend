// server.js
import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./db/config.js";
import adminRoutes from "./routers/admin/adminRoutes.js";
import authRoutes from "./routers/AuthRoutes.js";
import candidateAuthRoute from "./routers/candidate/candidateAuthRoute.js";
import employerAuthRoute from "./routers/employer/employerAuthRoute.js";
import jobsRoutes from "./routers/jobs/jobsRouter.js";

import { mergeSchemas } from "@graphql-tools/schema";
import { graphqlHTTP } from "express-graphql";
import industriesSchema from "./graphql/industriesSchema.js";
import locationSchema from "./graphql/locationSchema.js";
import queriesFilterSchema from "./graphql/queriesFilterSchema.js";

import searchQueriesRouter from "./routers/searchQueries.js";

const app = express();

connectDB();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(bodyParser.json());

app.use(
  "/uploads",
  express.static(path.join(__dirname, "seejob", "seejob", "uploads"))
);

app.use(morgan("dev"));

app.use(cors());

app.use(express.json());

app.use("/api/candidateAuthRoute", candidateAuthRoute);
app.use("/api/employerAuthRoute", employerAuthRoute);
app.use("/api/candidateAuth", authRoutes);
app.use("/api/jobs", jobsRoutes);
app.use("/api/admin", adminRoutes);

app.use("/searchQueries", searchQueriesRouter);

const PORT = process.env.PORT || 5000;

// Merge all schemas
const schema = mergeSchemas({
  schemas: [industriesSchema, locationSchema, queriesFilterSchema],
});

// Setup GraphQL endpoint
app.use("/graphql", (req, res, next) => {
  graphqlHTTP({
    schema,
    graphiql: true,
  })(req, res, next);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

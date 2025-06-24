// server.js

// ──────────────────────────────────────────────────
// Core & Third-party Imports
// ──────────────────────────────────────────────────
import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

// ──────────────────────────────────────────────────
// Database Connection
// ──────────────────────────────────────────────────
import connectDB from "./db/config.js";

// ──────────────────────────────────────────────────
// Models
// ──────────────────────────────────────────────────
import Employer from "./models/employer/employerModel.js";

// ──────────────────────────────────────────────────
// Routes
// ──────────────────────────────────────────────────

// Auth Routes
import authRoutes from "./routers/AuthRoutes.js";
import candidateAuthRoute from "./routers/candidate/candidateAuthRoute.js";
import employerAuthRoute from "./routers/employer/employerAuthRoute.js";

// Jobs & Search Routes
import jobsRoutes from "./routers/jobs/jobsRouter.js";
import searchQueriesRouter from "./routers/searchQueries.js";
import cronJobs from "./routers/cron-jobs.js";

// Admin Routes
import adminRoutes from "./routers/admin/adminRoutes.js";
import groupedFilterApi from "./routers/admin/groupedFilterApi.js";

/* ──────────────────────────────────────────────────
 *                GraphQL Schemas & Middleware
 * ────────────────────────────────────────────────── */
import { mergeSchemas } from "@graphql-tools/schema";
import { graphqlHTTP } from "express-graphql";

import candidateSchema from "./graphql/candidateSchema.js";
import industriesSchema from "./graphql/industriesSchema.js";
import jobApplicationSchema from "./graphql/jobApplicationSchema.js";
import locationSchema from "./graphql/locationSchema.js";
import queriesFilterSchema from "./graphql/queriesFilterSchema.js";

/* ──────────────────────────────────────────────────
 *                Google OAuth & Mail Services
 * ────────────────────────────────────────────────── */
import { getAuthUrl, getTokens, setCredentials } from "./config/oauth.js";
import { sendEmail } from "./services/sendMail.js";
import { getTokensFromDB } from "./services/tokenService.js";
import { getUserInfo } from "./utils/googleUtils.js";
import { google } from "googleapis";

// ──────────────────────────────────────────────────
// Plan Expiration Cron Job
// ──────────────────────────────────────────────────
import { startPlanExpiryCron } from "./controllers/admin/recruiters.js";

/* ─────────────────────────────────────────────
 *                App Setup
 * ───────────────────────────────────────────── */
const app = express();

connectDB();

// Start the cron job
startPlanExpiryCron();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ─────────────────────────────────────────────
 *                Middleware
 * ───────────────────────────────────────────── */
app.use(bodyParser.json());

app.use(morgan("dev"));

app.use(express.json());

const allowedOrigins = [
  "http://localhost:3000",
  "https://www.seejob.in",
  "https://seejob.in",
  "https://see-job-main-fe.vercel.app",
  "*",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        return callback(new Error("Not allowed by CORS"));
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

// Static File Serving
app.get("/", (req, res) => {
  res
    .status(200)
    .json({ message: "Backend Working : CORS-enabled for allowed origins!" });
});

app.use(
  "/uploads",
  express.static(path.join(__dirname, "seejob", "seejob", "uploads"))
);

/* ──────────────────────────────────────────────────
 *                API Routes
 * ────────────────────────────────────────────────── */

app.use("/api/candidateAuthRoute", candidateAuthRoute);
app.use("/api/employerAuthRoute", employerAuthRoute);
app.use("/api/candidateAuth", authRoutes);
app.use("/api/jobs", jobsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/groupedFilterApi", groupedFilterApi);

app.use("/searchQueries", searchQueriesRouter);
app.use("/cron-job", cronJobs);

/* ───────────────────────────────────────────────────────────
 *                OAuth Authentication Routes
 * ─────────────────────────────────────────────────────────── */

app.get("/auth/google", (req, res) => {
  const authUrl = getAuthUrl();
  res.redirect(authUrl);
});

app.get("/oauth2callback", async (req, res) => {
  const code = decodeURIComponent(req.query.code);

  // const expectedEmail = req.query.state;

  if (!code) {
    return res.status(400).json({ error: "Authorization code not provided" });
  } else {
    console.error("Code : ", code);
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  try {
    const tokens = await getTokens(code);
    // oauth2Client.setCredentials(tokens);

    const credentials = setCredentials(tokens);
    const oauth2 = google.oauth2({ auth: oauth2Client, version: "v2" });
    const userInfo = await oauth2.userinfo.get();
    const recruiterEmail = userInfo.data.email;

    await Employer.findOneAndUpdate(
      { email: recruiterEmail },
      {
        email: recruiterEmail,
        refreshToken: tokens.refresh_token,
        accessToken: tokens.access_token,
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      message: `
        <html>
          <body>
            <script>
              window.opener.postMessage("gmail-connected", "*");
              window.close();
            </script>
            <p>Authentication successful! You may close this window.</p>
          </body>
        </html>
      `,
      tokens,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve tokens" });
  }
});

// ──────────────────────────────────────────────────
// Email API
// ──────────────────────────────────────────────────

app.post("/api/send-email", async (req, res) => {
  const { recruiterEmail, recipients, subject, body } = req.body;

  if (!recruiterEmail || !recipients || !subject || !body) {
    return res.status(400).json({ error: "Missing email fields" });
  }

  if (!Array.isArray(recipients)) {
    return res.status(400).json({ error: "Recipients must be an array" });
  }

  const tokens = await getTokensFromDB(recruiterEmail);
  if (!tokens) {
    return res.status(400).json({ error: "No tokens found for recruiter" });
  }

  try {
    const result = await sendEmail(
      recruiterEmail,
      recipients,
      subject,
      body,
      tokens
    );
    res
      .status(200)
      .json({ message: "Email sent successfully", results: result });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to send email", details: error.message });
  }
});

// ──────────────────────────────────────────────────
// Recruiter Email Status
// ──────────────────────────────────────────────────
// GET /api/recruiter/status?email=recruiter@gmail.com
app.get("/api/recruiter/status", async (req, res) => {
  const { email } = req.query;
  const recruiter = await Employer.findOne({ email });

  if (!recruiter) return res.json({ isEmailConnected: false });
  return res.json({ isEmailConnected: !!recruiter.refreshToken });
});

// ──────────────────────────────────────────────────
// GraphQL Endpoint
// ──────────────────────────────────────────────────
// Merge all schemas
const schema = mergeSchemas({
  schemas: [
    industriesSchema,
    locationSchema,
    queriesFilterSchema,
    candidateSchema,
    jobApplicationSchema,
  ],
});

// Setup GraphQL endpoint
app.use("/graphql", (req, res, next) => {
  graphqlHTTP({
    schema,
    graphiql: true,
  })(req, res, next);
});

// ──────────────────────────────────────────────────
// Server Start
// ──────────────────────────────────────────────────
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;

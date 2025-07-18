// controllers/jobController.js
import mongoose from "mongoose";
import slugify from "slugify";
import Candidate from "../../models/candidate/candidateModel.js";
import Application from "../../models/jobs/application.js";
import JobListing from "../../models/jobs/jobsModel.js";
import { sendEmail } from "../../services/emailService.js";
import {
  buildAutoAppliedNotificationEmail,
  buildCandidateJobAppliedEmail,
  buildRecruiterJobNotificationEmail,
} from "../../templates/mail-templates.js";

// Controller function to save a new job listing
export const postJob = async (req, res) => {
  const {
    userid,
    jobTitle,
    // jobRole,
    // category,
    skills,
    jobType,
    degreeLevel,
    jobDescription,
    jobLocation,
    openings,
    // deadline,
    // status,
    monthlySalary,
    experience,
    education,
    companyName,
    companyEmail,
    companyPhone,
    companyWebsite,
    companyDescription,
    questions = [],
  } = req.body;

  try {
    const missingFields = [];

    if (!userid) missingFields.push("Employer Id");
    if (!jobTitle) missingFields.push("Job Title");
    // if (!jobRole) missingFields.push("Job Role");
    // if (!category) missingFields.push("Category");
    if (!skills || skills.length === 0) missingFields.push("Skills");
    if (!jobType || jobType.length === 0) missingFields.push("Job Type");
    if (!degreeLevel) missingFields.push("Degree Level");
    if (!jobDescription) missingFields.push("Job Description");
    if (!jobLocation) missingFields.push("Job Location");
    if (typeof openings !== "number" || openings < 1)
      missingFields.push("Openings must be at least 1");
    // if (!deadline) missingFields.push("Deadline");
    // if (!status) missingFields.push("Status");
    if (!monthlySalary?.min) missingFields.push("Min Salary");
    if (!monthlySalary?.max) missingFields.push("Max Salary");
    if (!experience?.min) missingFields.push("Min Experience");
    if (!experience?.max) missingFields.push("Max Experience");
    if (!education) missingFields.push("Education");
    if (!companyName) missingFields.push("Company Name");
    if (!companyEmail) missingFields.push("Company Email");
    if (!companyPhone) missingFields.push("Company Phone");
    // if (!companyWebsite) missingFields.push("Company Website");
    if (!companyDescription) missingFields.push("Company Description");

    if (missingFields.length > 0) {
      return res
        .status(400)
        .json({ message: `Missing fields:- ${missingFields.join(", ")}` });
    }

    const deadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const baseSlug = slugify(`${jobTitle}-${companyName}-${jobLocation}`, {
      lower: true,
      strict: true, // removes special chars
    });

    let uniqueSlug = baseSlug;
    let counter = 1;

    while (await JobListing.findOne({ url: uniqueSlug })) {
      uniqueSlug = `${baseSlug}-${counter++}`;
    }

    const jobData = {
      employer: userid,
      jobTitle,
      url: uniqueSlug,
      // jobRole,
      // category,
      skillsRequired: skills,
      jobType,
      degreeLevel,
      jobDescription,
      jobLocation,
      openings,
      // deadline,
      // status,
      monthlySalary: {
        min: monthlySalary.min,
        max: monthlySalary.max,
      },
      experience: {
        min: experience.min,
        max: experience.max,
      },
      education,
      companyName,
      companyEmail,
      companyPhone,
      companyDescription,
      questions,
      deadline,
      status: "open",
    };

    // Add companyWebsite only if it's provided
    if (companyWebsite?.trim()) {
      jobData.companyWebsite = companyWebsite.trim();
    }

    const newJobListing = new JobListing(jobData);
    await newJobListing.save();

    res
      .status(201)
      .json({ success: true, message: "Job posted successfully." });

    const matchingCandidates = await Candidate.find({
      "registration.skills": { $in: skills },
    });

    if (matchingCandidates.length > 0) {
      setImmediate(async () => {
        for (const candidate of matchingCandidates) {
          const candidateEmail = candidate?.registration?.email;
          const subject = `New Job Posting: ${jobTitle}`;
          const jobUrl = `${process.env.FRONTEND_URL}/joblisting/${newJobListing.url}`;

          const html = `
            <html>
              <head>
                <style>
                  body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 0;
                  }
                  .email-container {
                    background-color: #ffffff;
                    max-width: 600px;
                    margin: 20px auto;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                  }
                  h1 {
                    color: #333333;
                    font-size: 24px;
                  }
                  p {
                    color: #555555;
                    line-height: 1.5;
                  }
                  .cta-button {
                    display: inline-block;
                    background-color: #007bff;
                    color: white;
                    padding: 10px 20px;
                    border-radius: 5px;
                    text-decoration: none;
                    font-weight: bold;
                    margin-top: 20px;
                  }
                  .cta-button:hover {
                    background-color: #0056b3;
                  }
                  .footer {
                    text-align: center;
                    margin-top: 30px;
                    font-size: 12px;
                    color: #888888;
                  }
                </style>
              </head>
              <body>
                <div class="email-container">
                  <h1>New Job Posting: ${jobTitle}</h1>
                  <p>Dear ${
                    candidate?.registration?.fullName || "Candidate"
                  },</p>
                  <p>We are excited to inform you about a new job posting that matches your skills. Below are the details:</p>
                  <h2>Job Details:</h2>
                  <ul>
                    <li><strong>Job Title:</strong> ${jobTitle}</li>
                    <li><strong>Company:</strong> ${companyName}</li>
                    <li><strong>Location:</strong> ${jobLocation}</li>
                    <li><strong>Job Description:</strong> ${jobDescription}</li>
                  </ul>
                  <a href="${jobUrl}" class="cta-button" style="background-color: #007BFF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Apply Now</a>
                  <p>We hope this opportunity excites you, and we look forward to your application.</p>
                  <p>Best regards,<br>The See Job Team<br>
                  <a href="https://seejob.in" target="_blank" style="color: #007BFF; text-decoration: none;">seejob.in</a>
                  </p>
                </div>
              </body>
            </html>
          `;

          const text = `Hi ${
            candidate?.registration?.fullName || "Candidate"
          },\n\nWe have a new job posting that matches your skills: ${jobTitle}.\n\nHere are the details:\n\nJob Title: ${jobTitle}\nCompany: ${companyName}\nLocation: ${jobLocation}\nDescription: ${jobDescription}\n\nIf you're interested, apply now! Visit the link below to apply:\n\n${jobUrl}\n\nBest regards,\nThe Team`;

          try {
            await sendEmail({
              to: candidateEmail,
              subject,
              text,
              html,
            });
            console.log(`Email sent to ${candidateEmail}`);
          } catch (error) {
            console.error(`Failed to send email to ${candidateEmail}:`, error);
          }
        }
      });
    }
  } catch (error) {
    console.error("Error", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const applyToJob = async (req, res) => {
  const { jobId, candidateId, answers } = req.body;

  try {
    if (
      !mongoose.Types.ObjectId.isValid(jobId) ||
      !mongoose.Types.ObjectId.isValid(candidateId)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid job or candidate ID." });
    }

    const job = await JobListing.findById(jobId);
    const candidate = await Candidate.findById(candidateId);

    if (!job || !candidate) {
      return res
        .status(404)
        .json({ success: false, message: "Job or candidate not found." });
    }

    const jobObjectId = new mongoose.Types.ObjectId(jobId);
    const candidateObjectId = new mongoose.Types.ObjectId(candidateId);

    const hasAlreadyApplied = await Application.exists({
      job: jobObjectId,
      candidate: candidateObjectId,
    });

    if (hasAlreadyApplied) {
      return res.status(409).json({
        success: false,
        message: "You have already applied for this job.",
      });
    }

    const formattedAnswers = Object.entries(answers).map(
      ([questionId, answer]) => ({
        questionId: new mongoose.Types.ObjectId(questionId),
        answer,
      })
    );

    const newApplication = new Application({
      job: jobId,
      candidate: candidateId,
      employer: job.employer,
      answers: formattedAnswers,
      // resume,
      // attachedDocument,
    });

    await newApplication.save();

    candidate.jobs.appliedJobs.push({
      job: job._id,
      status: "Pending",
      appliedDate: newApplication.appliedAt || new Date(),
    });

    await candidate.save();

    res.status(200).json({
      success: true,
      message: "Application submitted successfully.",
    });

    const recruiterEmailContent = buildRecruiterJobNotificationEmail({
      candidate,
      job,
    });

    await sendEmail({
      to: job.employer.email,
      subject: recruiterEmailContent.subject,
      text: recruiterEmailContent.text,
      html: recruiterEmailContent.html,
    });

    // Send confirmation email to candidate
    const candidateEmailContent = buildCandidateJobAppliedEmail({
      candidate,
      job,
    });

    await sendEmail({
      to: candidate.registration.email,
      subject: candidateEmailContent.subject,
      text: candidateEmailContent.text,
      html: candidateEmailContent.html,
    });
  } catch (err) {
    console.error("Error applying to job:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// Use npm i plimit to limit max 5 job to get applications asynchronously at a time
export const autoApplyToJobs = async (req, res) => {
  const { numberOfCandidates = 5 } = req.body;
  try {
    const cursor = JobListing.find({ status: "open" }).cursor();

    for await (const job of cursor) {
      const existingCandidateIds = await Application.find({
        job: job._id,
      }).distinct("candidate");

      const pipeline = [
        {
          $match: {
            "registration.skills": { $in: job.skillsRequired },
            _id: { $nin: existingCandidateIds },
          },
        },
        {
          $addFields: {
            priority: {
              $cond: [
                { $eq: ["$registration.location", job.jobLocation] },
                1,
                0,
              ],
            },
          },
        },
        { $sort: { priority: -1 } },
        { $sample: { size: numberOfCandidates } },
      ];

      const candidates = await Candidate.aggregate(pipeline);

      if (!candidates.length) continue;

      const apps = candidates.map((c) => ({
        job: job._id,
        candidate: c._id,
        employer: job.employer,
        answers: [],
        status: "Pending",
      }));

      await Application.insertMany(apps);

      const bulkOps = candidates.map((c) => ({
        updateOne: {
          filter: { _id: c._id },
          update: {
            $push: {
              "jobs.appliedJobs": {
                job: job._id,
                status: "Pending",
                appliedDate: new Date(),
              },
            },
          },
        },
      }));

      await Candidate.bulkWrite(bulkOps);

      // Send recruiter notification email asynchronously
      setImmediate(async () => {
        try {
          const recruiterEmailContent = buildAutoAppliedNotificationEmail({
            job,
            candidates,
          });

          await sendEmail({
            to: job.employer.email,
            subject: recruiterEmailContent.subject,
            text: recruiterEmailContent.text,
            html: recruiterEmailContent.html,
          });
        } catch (emailErr) {
          console.error("Email error (auto-apply):", emailErr);
        }
      });
    }

    res.status(200).json({
      success: true,
      message: `Auto-applied ${numberOfCandidates} candidates for each active job.`,
    });
  } catch (err) {
    console.error("Auto-apply error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const saveJobListing = async (req, res) => {
  try {
    const jobData = req.body;
    const user = req.email;
    const newJobListing = await JobListing.create(jobData);

    res.status(201).json({
      success: true,
      data: newJobListing,
      message: "job has been posted successfully",
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAllJobs = async (req, res) => {
  const convertToLabel = (title) => {
    const formattedTitle = title
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
    return formattedTitle;
  };

  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
    const skip = (page - 1) * limit;

    const {
      jobTitle,
      salaryMin,
      salaryMax,
      experienceMin,
      experienceMax,
      location,
      candidateId,
      jobTypes,
    } = req.query;

    const andConditions = [];

    if (jobTitle) {
      const formattedJobTitle = convertToLabel(jobTitle);
      andConditions.push({ jobTitle: formattedJobTitle });
    }

    if (jobTypes) {
      const typesArray = jobTypes.split(",").map((type) => type.trim());
      if (typesArray.length > 0) {
        andConditions.push({
          jobType: { $in: typesArray },
        });
      }
    }

    if (location) {
      andConditions.push({
        jobLocation: {
          $regex: location,
          $options: "i",
        },
      });
    }

    if (!isNaN(salaryMin)) {
      const parsedMin = parseInt(salaryMin);
      andConditions.push({
        $or: [
          { "monthlySalary.min": { $gte: parsedMin } },
          { "monthlySalary.max": { $gte: parsedMin } },
        ],
      });
    }
    if (!isNaN(salaryMax)) {
      const parsedMax = parseInt(salaryMax);
      andConditions.push({ "monthlySalary.max": { $lte: parsedMax } });
    }

    if (!isNaN(experienceMin)) {
      const parsedMinExp = parseInt(experienceMin);
      andConditions.push({
        $or: [
          { "experience.min": { $gte: parsedMinExp } },
          { "experience.max": { $gte: parsedMinExp } },
        ],
      });
    }
    if (!isNaN(experienceMax)) {
      const parsedMaxExp = parseInt(experienceMax);
      andConditions.push({ "experience.max": { $lte: parsedMaxExp } });
    }

    andConditions.push({
      deadline: { $gte: new Date() },
      status: "open",
    });

    const matchStage = { $and: andConditions };

    // Aggregation pipeline starts here
    const pipeline = [
      { $match: matchStage },
      { $sort: { updatedAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ];

    // If candidateId is valid, add $lookup to find applied jobs and add hasApplied field
    if (
      candidateId &&
      mongoose.Types.ObjectId.isValid(candidateId) &&
      candidateId !== "null"
    ) {
      pipeline.push({
        $lookup: {
          from: "applications",
          let: { jobId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$job", "$$jobId"] },
                    {
                      $eq: [
                        "$candidate",
                        new mongoose.Types.ObjectId(candidateId),
                      ],
                    },
                  ],
                },
              },
            },
            { $project: { _id: 1 } },
          ],
          as: "applications",
        },
      });

      pipeline.push({
        $addFields: {
          hasApplied: { $gt: [{ $size: "$applications" }, 0] },
        },
      });

      pipeline.push({ $project: { applications: 0 } }); // Remove applications array
    }

    // Execute aggregation query
    const jobs = await JobListing.aggregate(pipeline);

    // Get total count for pagination (without skip/limit)
    const totalJobs = await JobListing.countDocuments(matchStage);
    const totalPages = Math.ceil(totalJobs / limit);

    return res.json({
      success: true,
      pagination: {
        currentPage: page,
        totalPages,
        totalJobs,
      },
      data: jobs,
    });
  } catch (error) {
    console.error("Error fetching jobs: ", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

export const editJobById = async (req, res) => {
  const { id } = req.params;

  const {
    userid,
    jobTitle,
    skillsRequired,
    jobType,
    degreeLevel,
    jobDescription,
    jobLocation,
    openings,
    monthlySalary,
    experience,
    education,
    companyName,
    companyEmail,
    companyPhone,
    companyWebsite,
    companyDescription,
    questions = [],
    status,
    url,
  } = req.body;

  try {
    if (!id) return res.status(400).json({ message: "Job ID is required." });

    const missingFields = [];

    if (!userid) missingFields.push("Employer ID");
    if (!jobTitle) missingFields.push("Job Title");
    if (!skillsRequired || skillsRequired.length === 0)
      missingFields.push("Skills");
    if (!jobType || jobType.length === 0) missingFields.push("Job Type");
    if (!degreeLevel) missingFields.push("Degree Level");
    if (!jobDescription) missingFields.push("Job Description");
    if (!jobLocation) missingFields.push("Job Location");
    if (typeof openings !== "number" || openings < 1)
      missingFields.push("Openings");
    if (!monthlySalary?.min || !monthlySalary?.max)
      missingFields.push("Salary Range");
    if (!experience?.min || !experience?.max)
      missingFields.push("Experience Range");
    if (!education) missingFields.push("Education");
    if (!companyName) missingFields.push("Company Name");
    if (!companyEmail) missingFields.push("Company Email");
    if (!companyPhone) missingFields.push("Company Phone");
    if (!companyDescription) missingFields.push("Company Description");
    if (!url) missingFields.push("Job URL");

    if (missingFields.length > 0) {
      return res
        .status(400)
        .json({ message: `Missing fields: ${missingFields.join(", ")}` });
    }

    const job = await JobListing.findById(id);
    if (!job) {
      return res.status(404).json({ message: "Job not found." });
    }

    const existingUrl = await JobListing.findOne({ url, _id: { $ne: id } });
    if (existingUrl) {
      return res
        .status(409)
        .json({ message: "URL is already in use by another job." });
    }

    Object.assign(job, {
      employer: userid,
      jobTitle,
      url,
      skillsRequired,
      jobType,
      degreeLevel,
      jobDescription,
      jobLocation,
      openings,
      monthlySalary,
      experience,
      education,
      companyName,
      companyEmail,
      companyPhone,
      companyWebsite: companyWebsite?.trim() || "",
      companyDescription,
      questions,
      status: status || "open",
    });

    await job.save();

    res.status(200).json({
      success: true,
      message: "Job updated successfully.",
      job,
    });
  } catch (error) {
    console.error("Error updating job:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getJobById = async (req, res) => {
  try {
    const jobId = req.params.id;

    const job = await JobListing.findById(jobId);
    if (!job) {
      return res
        .status(404)
        .json({ success: false, message: "Job not found", job });
    }

    const applicationCount = await Application.countDocuments({ job: jobId });

    res.json({ success: true, applicationCount, job });
  } catch (error) {
    console.error("Error fetching job details:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getJobByUrl = async (req, res) => {
  try {
    const jobUrl = req.params.url;

    const job = await JobListing.findOne({ url: jobUrl });
    if (!job) {
      return res
        .status(404)
        .json({ success: false, message: "Job not found", job });
    }

    const applicationCount = await Application.countDocuments({ job: job._id });

    res.json({ success: true, applicationCount, job });
  } catch (error) {
    console.error("Error fetching job details:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getSearchJobs = async (req, res) => {
  try {
    // Extract parameters from the request query
    const {
      lookingFor,
      youLiveAt,
      role,
      locality,
      salaryMin,
      salaryMax,
      experience,
      education,
      workShift,
      jobType,
      category,
      skills,
    } = req.query;

    // Construct the filter object
    const filter = {};

    if (lookingFor) {
      filter.jobTitle = new RegExp(lookingFor, "i");
    }

    if (youLiveAt) {
      filter.locality = new RegExp(youLiveAt, "i");
    }

    if (role) {
      filter.role = new RegExp(role, "i");
    }

    if (locality) {
      filter.locality = new RegExp(locality, "i");
    }

    if (category) {
      filter.category = new RegExp(category, "i");
    }

    if (salaryMin || salaryMax) {
      if (salaryMin) {
        filter["monthlySalary.min"] = { $lte: parseFloat(salaryMin) };
      }
      if (salaryMax) {
        filter["monthlySalary.max"] = { $gte: parseFloat(salaryMax) };
      }
    }

    if (experience) {
      filter.experience = experience;
    }

    if (education) {
      filter.education = { $in: education.split(",") };
    }

    if (workShift) {
      filter.workShift = { $in: workShift.split(",") };
    }

    if (jobType) {
      filter.jobType = { $in: jobType.split(",") };
    }

    if (skills) {
      filter.skills = { $in: skills.split(",") };
    }

    const jobs = await JobListing.find(filter);

    if (jobs.length > 0) {
      return res.status(200).send({
        success: true,
        jobs,
      });
    } else {
      return res.status(404).send({
        success: true,
        message: "No jobs found matching your criteria",
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      success: false,
      message: "Error in the search job API",
      error: error.message,
    });
  }
};

export const getSimilarJobs = async (req, res) => {
  const { id } = req.params;
  try {
    const job = await JobListing.findById(id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    // Define the criteria for similar jobs
    const similarJobs = await JobListing.find({
      category: job.category,
      // role: job.role,
    }).limit(6); // Limit the number of similar jobs returned

    res.json({ success: true, similarJobs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getJobsPostedByRecruiter = async (req, res) => {
  const { userId } = req.params;
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
  const skip = (page - 1) * limit;

  try {
    // const employerExist = await Employer.findById(userId);
    // if (!employerExist) {
    //   return res
    //     .status(404)
    //     .json({ success: false, message: "Employer not found" });
    // }

    const totalJobs = await JobListing.countDocuments({ employer: userId });

    const jobs = await JobListing.find({ employer: userId })
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(limit)
      .exec();

    return res.status(200).json({
      success: true,
      total: totalJobs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalJobs / limit),
      },
      data: jobs,
    });
  } catch (error) {
    console.error("Error fetching posted jobs:", error);
    return res.status(500).json({
      success: false,
      error: error,
      message: "Internal Server Error",
    });
  }
};

export const getJobsAppliedByCandidate = async (req, res) => {
  const { userId } = req.params;
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
  const skip = (page - 1) * limit;

  try {
    const candidateExist = await Candidate.findById(userId);
    if (!candidateExist) {
      return res
        .status(404)
        .json({ success: false, message: "Candidate not found" });
    }

    const totalApplications = await Application.countDocuments({
      candidate: userId,
    });

    const applications = await Application.find({ candidate: userId })
      .populate("job")
      .sort({ appliedAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const jobsApplied = applications.map((app) => ({
      job: app.job,
      status: app.status,
      appliedAt: app.appliedAt,
    }));

    return res.status(200).json({
      success: true,
      total: totalApplications,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalApplications / limit),
      },
      data: jobsApplied,
    });
  } catch (error) {
    console.error("Error fetching applied jobs:", error);
    return res.status(500).json({
      success: false,
      error: error,
      message: "Internal Server Error",
    });
  }
};

export const getJobApplicantsDetail = async (req, res) => {
  const { userId } = req.params;
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
  const skip = (page - 1) * limit;

  try {
    // const employerExist = await Employer.findById(userId);
    // if (!employerExist) {
    //   return res
    //     .status(404)
    //     .json({ success: false, message: "Employer not found" });
    // }

    const totalJobs = await JobListing.countDocuments({ employer: userId });

    const jobs = await JobListing.find({ employer: userId })
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(limit)
      .exec();

    return res.status(200).json({
      success: true,
      total: totalJobs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalJobs / limit),
      },
      data: jobs,
    });
  } catch (error) {
    console.error("Error fetching posted jobs:", error);
    return res.status(500).json({
      success: false,
      error: error,
      message: "Internal Server Error",
    });
  }
};

export const getJobsApplications = async (req, res) => {
  const { jobId } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job ID.",
      });
    }

    // Find applications for this job and populate candidate data
    const applications = await Application.find({ job: jobId })
      .populate({
        path: "candidate",
        select: `
          registration.fullName 
          registration.email 
          registration.phone 
          registration.location
          registration.minexp
          registration.maxexp
          registration.skills
          registration.resume
          jobPreferences.profileTitle 
          jobPreferences.jobRoles
          jobPreferences.jobType
          jobPreferences.preferredJobLocation
          jobPreferences.gender
          jobPreferences.dob
          jobPreferences.currentSalary
          jobPreferences.expectedSalary
          jobPreferences.maritalStatus
          jobPreferences.language
          jobPreferences.image
          candidateEducation.highestQualification 
          candidateEducation.percentage 
          candidateEducation.boardOfEducation
          candidateEducation.yearOfEducation
        `,
      })
      .select("candidate appliedAt answers resume attachedDocument status")
      .exec();

    if (!applications || applications.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No applicants found for this job.",
      });
    }

    // Calculate summary stats
    const statusCounts = {
      pending: 0,
      shortlisted: 0,
      rejected: 0,
      hired: 0,
    };

    applications.forEach((app) => {
      const status = app.status || "pending";
      if (statusCounts[status] !== undefined) {
        statusCounts[status]++;
      }
    });

    return res.status(200).json({
      success: true,
      totalApplicants: applications.length,
      statusSummary: statusCounts,
      applicants: applications.map((app) => ({
        _id: app._id,
        appliedAt: app.appliedAt,
        resume: app.resume,
        attachedDocument: app.attachedDocument,
        status: app.status,
        answers: app.answers,
        candidate: app.candidate,
      })),
    });
  } catch (error) {
    console.error("Error fetching applicants:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

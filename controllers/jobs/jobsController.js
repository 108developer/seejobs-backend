// controllers/jobController.js
import JobListing from "../../models/jobs/jobsModel.js";

import Candidate from "../../models/candidate/candidateModel.js";
import Employer from "../../models/employer/employerModel.js";
import Application from "../../models/jobs/application.js";
import mongoose from "mongoose";

// Controller function to save a new job listing
export const postJob = async (req, res) => {
  const {
    userid,
    jobTitle,
    // jobRole,
    // category,
    skills,
    jobType,
    jobDescription,
    jobLocation,
    openings,
    deadline,
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
    if (!jobDescription) missingFields.push("Job Description");
    if (!jobLocation) missingFields.push("Job Location");
    if (typeof openings !== "number" || openings < 1)
      missingFields.push("Openings must be at least 1");
    if (!deadline) missingFields.push("Deadline");
    // if (!status) missingFields.push("Status");
    if (!monthlySalary?.min) missingFields.push("Min Salary");
    if (!monthlySalary?.max) missingFields.push("Max Salary");
    if (!experience?.min) missingFields.push("Min Experience");
    if (!experience?.max) missingFields.push("Max Experience");
    if (!education) missingFields.push("Education");
    if (!companyName) missingFields.push("Company Name");
    if (!companyEmail) missingFields.push("Company Email");
    if (!companyPhone) missingFields.push("Company Phone");
    if (!companyWebsite) missingFields.push("Company Website");
    if (!companyDescription) missingFields.push("Company Description");

    if (missingFields.length > 0) {
      return res
        .status(400)
        .json({ message: `Missing fields:- ${missingFields.join(", ")}` });
    }

    const newJobListing = new JobListing({
      employer: userid,
      jobTitle,
      // jobRole,
      // category,
      skillsRequired: skills,
      jobType,
      jobDescription,
      jobLocation,
      openings,
      deadline,
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
      companyWebsite,
      companyDescription,
      questions,
    });

    await newJobListing.save();

    return res
      .status(201)
      .json({ success: true, message: "Job posted successfully." });
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

    return res
      .status(200)
      .json({ success: true, message: "Application submitted successfully." });
  } catch (err) {
    console.error("Error applying to job:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
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
      // role,
      salaryMin,
      salaryMax,
      experienceMin,
      experienceMax,
      location,
      candidateId,
      jobTypes,
    } = req.query;

    const filter = {};
    const andConditions = [];

    if (jobTitle) {
      const formattedJobTitle = convertToLabel(jobTitle);
      andConditions.push({ jobTitle: formattedJobTitle });
    }

    // if (role) {
    //   andConditions.push({ role });
    // }

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

    if (andConditions.length > 0) {
      filter["$and"] = andConditions;
    }

    const totalJobs = await JobListing.countDocuments(filter);
    const jobs = await JobListing.find(filter).skip(skip).limit(limit).exec();

    if (
      candidateId &&
      mongoose.Types.ObjectId.isValid(candidateId) &&
      candidateId !== "null"
    ) {
      const appliedJobs = await Application.find({
        candidate: candidateId,
        job: { $in: jobs.map((job) => job._id) },
      }).select("job");

      const appliedJobIds = appliedJobs.map((app) => app.job.toString());

      const jobsWithAppliedStatus = jobs.map((job) => {
        return {
          ...job.toObject(),
          hasApplied: appliedJobIds.includes(job._id.toString()),
        };
      });
      const totalPages = Math.ceil(totalJobs / limit);

      return res.json({
        success: true,
        pagination: {
          currentPage: page,
          totalPages,
          totalJobs,
        },
        data: jobsWithAppliedStatus,
      });
    }

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
    res.json({ success: true, job });
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
          registration.industry
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

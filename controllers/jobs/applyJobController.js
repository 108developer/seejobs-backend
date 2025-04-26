import applyJobs from "../../models/jobs/applyJobs.js";
import path from "path";
import Candidate from "../../models/candidate/candidateModel.js";
import JobListing from "../../models/jobs/jobsModel.js";

export const applyJobsController = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Resume is required" });
    }

    const user = new applyJobs({
      name: req.body.name,
      email: req.body.email,
      locality: req.body.locality,
      mobile: req.body.mobile,
      currentCity: req.body.currentCity,
      speaksEnglish: req.body.speaksEnglish,
      isFresher: req.body.isFresher,
      experience: req.body.experience,
      gender: req.body.gender,
      ownsVehicle: req.body.ownsVehicle,
      resume: req.file.path,
    });

    res.status(201).send({
      message: "success",
      user,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// List of all the jobs posted by a Recruiter
export const postedJobs = async (req, res) => {
  try {
  } catch (error) {
    console.error("ERROR", error.message);
    res.status(400).json({ message: error.message });
  }
};

// Apply for a Job
export const applyJob = async (req, res) => {
  const { candidateId, jobId } = req.body;
  try {
    const job = await JobListing.findById(jobId);
    const candidate = await Candidate.findById(candidateId);

    if (!job || !candidate) {
      return res.status(404).json({ message: "Job or Candidate not found" });
    }

    if (candidate.appliedJobs.includes(jobId)) {
      return res
        .status(400)
        .json({ message: "You have already applied for this job" });
    }

    job.applicants.push(candidate._id);
    await job.save();

    candidate.appliedJobs.push(job._id);
    await candidate.save();

    return res
      .status(200)
      .json({ message: "Successfully applied for the job" });
  } catch (error) {
    console.error("ERROR", error.message);
    res.status(400).json({ message: error.message });
  }
};

// Jobs Applied by Job Seeker
export const appliedJobs = async (req, res) => {
  try {
  } catch (error) {
    console.error("ERROR", error.message);
    res.status(400).json({ message: error.message });
  }
};

// List of all the candidates who have applied for a job
export const jobApplications = async (req, res) => {
  try {
  } catch (error) {
    console.error("ERROR", error.message);
    res.status(400).json({ message: error.message });
  }
};

// Info of a specific candidates who has applied for a job
export const candidateApplied = async (req, res) => {
  try {
  } catch (error) {
    console.error("ERROR", error.message);
    res.status(400).json({ message: error.message });
  }
};

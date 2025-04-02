import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Candidate from "../../models/candidate/candidateModel.js";
import { uploadToCloudinary } from "../../utils/cloudinary.js";
import moment from "moment";

// Modal Sign Up Controller
export const signup = async (req, res) => {
  const { fullName, email, phone, password } = req.body;

  try {
    if (!fullName || !email || !phone || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const existingCandidate = await Candidate.findOne({
      $or: [{ "registration.email": email }, { "registration.phone": phone }],
    });
    if (existingCandidate) {
      return res
        .status(400)
        .json({ message: "Email or Phone already exists." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newCandidate = new Candidate({
      registration: {
        fullName,
        email,
        phone,
        password: hashedPassword,
        role: "user",
      },
      jobPreferences: {},
      candidateEducation: {},
    });

    await newCandidate.save();

    const token = jwt.sign(
      { userId: newCandidate._id, role: "user" },
      "your_jwt_secret",
      { expiresIn: "1h" }
    );

    res.status(201).json({
      success: true,
      message:
        "Candidate signed up successfully! Please complete your registration.",
      token,
      candidateId: newCandidate._id,
      email: newCandidate.registration.email,
      phone: newCandidate.registration.phone,
      fullName: newCandidate.registration.fullName,
      role: newCandidate.registration.role,
      expiresIn: "1h",
    });
  } catch (error) {
    console.error("Error during registration:", error);
    if (error.name === "MongoError" && error.code === 11000) {
      return res
        .status(400)
        .json({ message: "Email or Phone already exists." });
    }
    res.status(500).json({ message: "Failed to register Candidate." });
  }
};

// Login Controller
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const candidate = await Candidate.findOne({ "registration.email": email });
    if (!candidate) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(
      password,
      candidate.registration.password
    );
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: candidate._id }, "yourSecretKey", {
      expiresIn: "1h",
    });

    res.json({
      success: true,
      message: "Candidate login successful!",
      token,
      candidateId: candidate._id,
      email: candidate.registration.email,
      phone: candidate.registration.phone,
      fullName: candidate.registration.fullName,
      phone: candidate.registration.phone,
      role: candidate.registration.role,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to log in." });
  }
};

// Registration Controller - Step - 1
export const register = async (req, res) => {
  const {
    candidateId,
    location,
    minexp,
    maxexp,
    skills,
    industry,
    jobDescription,
    terms,
  } = req.body;

  const { resume } = req.files;

  try {
    if (
      !candidateId ||
      !location ||
      !minexp ||
      !maxexp ||
      !skills ||
      !industry ||
      !jobDescription ||
      !terms
    ) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const candidate = await Candidate.findById(candidateId);

    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found." });
    }

    candidate.registration.location = location;
    candidate.registration.minexp = minexp;
    candidate.registration.maxexp = maxexp;
    candidate.registration.skills = skills;
    candidate.registration.industry = industry;
    candidate.registration.jobDescription = jobDescription;
    candidate.registration.terms = terms;

    if (resume && resume.length > 0) {
      const [resumeResult] = await Promise.all([
        uploadToCloudinary(
          resume[0].buffer,
          "see_job_candidate_resumes",
          candidate.registration.email + "_resume"
        ),
      ]);
      candidate.registration.resume = resumeResult.secure_url;
    }

    await candidate.save();

    res.status(200).json({
      success: true,
      message: "Registration completed successfully!",
    });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ message: "Failed to complete registration." });
  }
};

// Update Registration Controller
export const updateRegistration = async (req, res) => {
  const { userId, token } = req.params;
  const {
    fullName,
    email,
    phone,
    location,
    minexp,
    maxexp,
    skills,
    industry,
    jobDescription,
    terms,
  } = req.body;

  try {
    // Authorization check (if required)
    const candidate = await Candidate.findById(userId);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found." });
    }

    // Update registration details
    candidate.registration.fullName = fullName;
    candidate.registration.email = email;
    candidate.registration.phone = phone;
    candidate.registration.location = location;
    candidate.registration.minexp = minexp;
    candidate.registration.maxexp = maxexp;
    candidate.registration.skills = skills;
    candidate.registration.industry = industry;
    candidate.registration.jobDescription = jobDescription;
    candidate.registration.terms = terms;

    await candidate.save();

    res.status(200).json({
      success: true,
      message: "Registration details updated successfully!",
    });
  } catch (error) {
    console.error("Error during updating registration:", error);
    res.status(500).json({ message: "Failed to update registration details." });
  }
};

// Registration Controller - Step - 2
export const saveJobPreferences = async (req, res) => {
  const {
    candidateId,
    profileTitle,
    jobType,
    experienceYears,
    experienceMonths,
    gender,
    dob,
    maritalStatus,
    language,
  } = req.body;

  const profilePic = req.files ? req.files.profilePic : null;

  try {
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    let profilePicResult = null;
    if (profilePic && profilePic.length > 0) {
      profilePicResult = await uploadToCloudinary(
        profilePic[0].buffer,
        "see_job_candidate_profilePic",
        candidateId + "_profilePic"
      );
    }

    const formattedDob = moment(dob, "DD/MM/YYYY").toDate();

    candidate.jobPreferences = {
      profilePic: profilePicResult || null,
      profileTitle,
      jobType,
      experienceYears,
      experienceMonths,
      gender,
      dob: formattedDob,
      maritalStatus,
      language,
    };
    await candidate.save();

    res
      .status(201)
      .json({ success: true, message: "Job preferences saved successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to save job preferences." });
  }
};

// Update Job Preferences Controller
export const updateJobPreferences = async (req, res) => {
  const { userId, token } = req.params;
  const {
    profileTitle,
    jobType,
    experienceYears,
    experienceMonths,
    gender,
    dob,
    maritalStatus,
    language,
  } = req.body;

  try {
    const candidate = await Candidate.findById(userId);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    // Update job preferences
    candidate.jobPreferences = {
      profileTitle,
      jobType,
      experienceYears,
      experienceMonths,
      gender,
      dob,
      maritalStatus,
      language,
    };

    await candidate.save();

    res.status(200).json({
      success: true,
      message: "Job preferences updated successfully!",
    });
  } catch (error) {
    console.error("Error during updating job preferences:", error);
    res.status(500).json({ message: "Failed to update job preferences." });
  }
};

// Registration Controller - Step - 3
export const saveEducationalDetails = async (req, res) => {
  const {
    candidateId,
    highestQualification,
    medium,
    boardOfEducation,
    percentage,
    yearOfEducation,
    educationMode,
  } = req.body;

  try {
    if (
      !highestQualification ||
      !medium ||
      !boardOfEducation ||
      !percentage ||
      !yearOfEducation ||
      !educationMode
    ) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const candidate = await Candidate.findById(candidateId);

    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    // Check if the candidate already has this education record
    candidate.candidateEducation = {
      highestQualification,
      medium,
      boardOfEducation,
      percentage,
      yearOfEducation,
      educationMode,
    };

    await candidate.save();

    res.status(201).json({
      success: true,
      message: "Educational details saved successfully!",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to save educational details." });
  }
};

// Update Educational Details Controller
export const updateEducationalDetails = async (req, res) => {
  const { userId, token } = req.params;
  const {
    highestQualification,
    medium,
    boardOfEducation,
    percentage,
    yearOfEducation,
    educationMode,
  } = req.body;

  try {
    const candidate = await Candidate.findById(userId);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    // Update educational details
    candidate.candidateEducation = {
      highestQualification,
      medium,
      boardOfEducation,
      percentage,
      yearOfEducation,
      educationMode,
    };

    await candidate.save();

    res.status(200).json({
      success: true,
      message: "Educational details updated successfully!",
    });
  } catch (error) {
    console.error("Error during updating educational details:", error);
    res.status(500).json({ message: "Failed to update educational details." });
  }
};

// Get Single Candidate Profile
export const getCandidateProfile = async (req, res) => {
  const { candidateId } = req.params;

  try {
    const candidate = await Candidate.findById(candidateId);

    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    res.status(200).json({
      profilePic: candidate.profilePic || null,
      resume: candidate.registration.resume || null,
      registration: {
        candidateId: candidate._id,
        fullName: candidate.registration.fullName,
        email: candidate.registration.email,
        phone: candidate.registration.phone,
        location: candidate.registration.location,
        minexp: candidate.registration.minexp,
        maxexp: candidate.registration.maxexp,
        skills: candidate.registration.skills,
        industry: candidate.registration.industry,
        jobDescription: candidate.registration.jobDescription,
        terms: candidate.registration.terms,
        role: candidate.registration.role,
        resume: candidate.registration.resume || null,
      },
      jobPreferences: {
        profileTitle: candidate.jobPreferences?.profileTitle || "",
        jobType: candidate.jobPreferences?.jobType || "",
        gender: candidate.jobPreferences?.gender || "male",
        dob: candidate.jobPreferences?.dob || new Date(),
        maritalStatus: candidate.jobPreferences?.maritalStatus || "",
        language: candidate.jobPreferences?.language || "",
        jobRoles: candidate.jobPreferences?.jobRoles || [],
      },
      candidateEducation: {
        highestQualification:
          candidate.candidateEducation?.highestQualification || "",
        medium: candidate.candidateEducation?.medium || "",
        boardOfEducation: candidate.candidateEducation?.boardOfEducation || "",
        percentage: candidate.candidateEducation?.percentage || "",
        yearOfEducation: candidate.candidateEducation?.yearOfEducation || "",
        educationMode: candidate.candidateEducation?.educationMode || "",
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch candidate profile." });
  }
};

// Update Candidate Profile Controller
export const updateCandidateProfile = async (req, res) => {
  const { candidateId } = req.params;
  const {
    fullName,
    email,
    phone,
    location,
    minexp,
    maxexp,
    skills,
    industry,
    resume,
    jobDescription,
    terms,
    profileTitle,
    jobType,
    gender,
    dob,
    maritalStatus,
    language,
    highestQualification,
    medium,
    boardOfEducation,
    percentage,
    yearOfEducation,
    educationMode,
  } = req.body;
  const { profilePic, resumeFile } = req.files || {};

  try {
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    // Extract existing values from the candidate object if not passed
    let profilePicUrl = candidate.registration.profilePic;
    let resumeUrl = candidate.registration.resume;

    const updatePromises = [];

    // Handle file uploads if necessary
    if (profilePic) {
      await deleteFromCloudinary(
        candidate.registration.profilePic.split("/").pop().split(".")[0]
      );
      updatePromises.push(
        uploadToCloudinary(
          profilePic[0].buffer,
          "see_job_candidate_profile_pictures",
          `profilePic_${candidateId}`
        ).then((result) => {
          profilePicUrl = result.secure_url;
        })
      );
    }

    if (resumeFile) {
      await deleteFromCloudinary(
        candidate.registration.resume.split("/").pop().split(".")[0]
      );
      updatePromises.push(
        uploadToCloudinary(
          resumeFile[0].buffer,
          "see_job_candidate_resumes",
          `resume_${candidateId}`
        ).then((result) => {
          resumeUrl = result.secure_url;
        })
      );
    }

    await Promise.all(updatePromises);

    const updatedCandidate = await Candidate.findByIdAndUpdate(
      candidateId,
      {
        registration: {
          fullName: fullName || candidate.registration.fullName,
          email: email || candidate.registration.email,
          phone: phone || candidate.registration.phone,
          location: location || candidate.registration.location,
          minexp: minexp || candidate.registration.minexp,
          maxexp: maxexp || candidate.registration.maxexp,
          skills: skills || candidate.registration.skills,
          industry: industry || candidate.registration.industry,
          resume: resume || candidate.registration.resume,
          jobDescription:
            jobDescription || candidate.registration.jobDescription,
          terms: terms || candidate.registration.terms,
        },
        jobPreferences: {
          profileTitle: profileTitle || candidate.jobPreferences.profileTitle,
          jobType: jobType || candidate.jobPreferences.jobType,
          gender: gender || candidate.jobPreferences.gender,
          dob: dob || candidate.jobPreferences.dob,
          maritalStatus:
            maritalStatus || candidate.jobPreferences.maritalStatus,
          language: language || candidate.jobPreferences.language,
        },
        candidateEducation: {
          highestQualification:
            highestQualification ||
            candidate.candidateEducation.highestQualification,
          medium: medium || candidate.candidateEducation.medium,
          boardOfEducation:
            boardOfEducation || candidate.candidateEducation.boardOfEducation,
          percentage: percentage || candidate.candidateEducation.percentage,
          yearOfEducation:
            yearOfEducation || candidate.candidateEducation.yearOfEducation,
          educationMode:
            educationMode || candidate.candidateEducation.educationMode,
        },
        profilePic: profilePicUrl,
        resume: resumeUrl,
      },
      { new: true }
    );

    res.status(200).json({
      message: "Profile updated successfully!",
      candidate: updatedCandidate,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update profile." });
  }
};

// Get Job Preferences Controller

export const getJobPreferences = async (req, res) => {
  const { candidateId } = req.query;

  try {
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    res.status(200).json(candidate.jobPreferences);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get job preferences." });
  }
};

// Get Educational Details Controller

export const getEducationalDetails = async (req, res) => {
  const { candidateId } = req.query;

  try {
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    res.status(200).json(candidate.educationalDetails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get educational details." });
  }
};

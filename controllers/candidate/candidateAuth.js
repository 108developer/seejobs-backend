import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import moment from "moment";
import Candidate from "../../models/candidate/candidateModel.js";
import {
  deleteFromCloudinary,
  uploadToCloudinary,
} from "../../utils/cloudinary.js";
import bulkUploadHandler from "../../utils/bulkuploadhandler.js";

const getCloudinaryPublicId = (url) => {
  const decodedUrl = decodeURIComponent(url);

  const regex =
    /https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/v\d+\/(see_job_candidate_resumes\/[^/]+\/[^?]+)(?=\.(jpg|jpeg|png|pdf|docx|doc))/;

  const match = decodedUrl.match(regex);

  if (match) {
    console.log("Decoded URL: ", decodedUrl);
    console.log("Extracted Public ID: ", match[1]);

    return match[1];
  } else {
    console.log("No match found for URL", decodedUrl);
    return null;
  }
};

const mapCandidateRowToModel = async (row) => {
  const hashedPassword = await bcrypt.hash(row.password, 10);

  const parsedDOB = moment(row.dob, "DD/MM/YYYY").toDate();
  const age = moment().diff(parsedDOB, "years");

  return {
    registration: {
      fullName: row.fullName,
      email: row.email,
      phone: row.phone,
      password: hashedPassword,
      location: row.location,
      permanentAddress: row.permanentAddress,
      minexp: row.minexp,
      maxexp: row.maxexp,
      skills: row.skills?.split(",").map((s) => s.trim()),
      industry: row.industry,
      jobDescription: row.jobDescription,
      role: "candidate",
    },
    jobPreferences: {
      profileTitle: row.profileTitle,
      jobType: row.jobType,
      preferredJobLocation: row.preferredJobLocation
        ?.split(",")
        .map((loc) => loc.trim()),
      experienceYears: row.experienceYears,
      experienceMonths: row.experienceMonths,
      gender: row.gender,
      dob: parsedDOB,
      age: age,
      maritalStatus: row.maritalStatus,
      language: row.language,
      currentSalary: row.currentSalary,
      expectedSalary: row.expectedSalary,
    },
    candidateEducation: {
      highestQualification: row.highestQualification,
      medium: row.medium,
      boardOfEducation: row.boardOfEducation,
      percentage: row.percentage,
      yearOfEducation: row.yearOfEducation,
      educationMode: row.educationMode,
    },
  };
};

export const bulkUploadCandidates = bulkUploadHandler(
  [
    "fullName",
    "email",
    "phone",
    "password",
    "location",
    "permanentAddress",
    "minexp",
    "maxexp",
    "skills",
    "industry",
    "jobDescription",
    "profileTitle",
    "jobType",
    "preferredJobLocation",
    "experienceYears",
    "experienceMonths",
    "gender",
    "dob",
    "maritalStatus",
    "language",
    "currentSalary",
    "expectedSalary",
    "highestQualification",
    "medium",
    "boardOfEducation",
    "percentage",
    "yearOfEducation",
    "educationMode",
  ],
  Candidate,
  "registration.email",
  mapCandidateRowToModel
);

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
        role: "candidate",
      },
      jobPreferences: {},
      candidateEducation: {},
    });

    await newCandidate.save();

    const token = jwt.sign(
      { userId: newCandidate._id, role: "candidate" },
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

// Get Single Candidate Profile
export const getCandidateProfile = async (req, res) => {
  const { candidateId } = req.params;

  try {
    const candidate = await Candidate.findById(candidateId);

    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    res.status(200).json({
      profilePic: candidate.jobPreferences.profilePic || null,
      resume: candidate.registration.resume || null,
      registration: {
        candidateId: candidate._id,
        fullName: candidate.registration.fullName,
        email: candidate.registration.email,
        phone: candidate.registration.phone,
        location: candidate.registration.location,
        permanentAddress: candidate.registration.permanentAddress,
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
        preferredJobLocation:
          candidate.jobPreferences?.preferredJobLocation || "",
        gender: candidate.jobPreferences?.gender || "male",
        dob: candidate.jobPreferences?.dob || new Date(),
        currentSalary: candidate.jobPreferences?.currentSalary || null,
        expectedSalary: candidate.jobPreferences?.expectedSalary || null,
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

// Registration Controller - Step - 1
export const register = async (req, res) => {
  const {
    candidateId,
    location,
    permanentAddress,
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
      !permanentAddress ||
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
    candidate.registration.permanentAddress = permanentAddress;
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
    permanentAddress,
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
    candidate.registration.permanentAddress = permanentAddress;
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
    preferredJobLocation,
    experienceYears,
    experienceMonths,
    gender,
    dob,
    maritalStatus,
    language,
    currentSalary,
    expectedSalary,
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

    let validPreferredJobLocation = Array.isArray(preferredJobLocation)
      ? preferredJobLocation
      : JSON.parse(preferredJobLocation);

    if (!Array.isArray(validPreferredJobLocation)) {
      return res
        .status(400)
        .json({ message: "Invalid preferred job location data" });
    }

    const formattedDob = moment(dob, "DD/MM/YYYY").toDate();
    const calculateAge = moment().diff(formattedDob, "years");

    candidate.jobPreferences = {
      profilePic: profilePicResult || null,
      profileTitle,
      jobType,
      preferredJobLocation: validPreferredJobLocation,
      experienceYears,
      experienceMonths,
      gender,
      dob: formattedDob,
      age: calculateAge,
      maritalStatus,
      language,
      currentSalary,
      expectedSalary,
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
  const { userId } = req.params;
  const {
    profileTitle,
    jobType,
    preferredJobLocation,
    gender,
    dob,
    maritalStatus,
    language,
    currentSalary,
    expectedSalary,
    experienceYears,
    experienceMonths,
  } = req.body;

  try {
    const missingFields = [];

    if (!profileTitle) missingFields.push("profileTitle");
    if (!jobType) missingFields.push("jobType");
    if (!preferredJobLocation) missingFields.push("preferredJobLocation");
    if (!gender) missingFields.push("gender");
    if (!dob) missingFields.push("dob");
    if (!maritalStatus) missingFields.push("maritalStatus");
    if (!language) missingFields.push("language");
    if (!currentSalary) missingFields.push("currentSalary");
    if (!expectedSalary) missingFields.push("expectedSalary");
    if (!experienceYears) missingFields.push("experienceYears");
    if (!experienceMonths) missingFields.push("experienceMonths");

    if (missingFields.length > 0) {
      return res
        .status(400)
        .json({ message: `Missing fields: ${missingFields.join(", ")}` });
    }

    const candidate = await Candidate.findById(userId);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    const formattedDob = moment(dob, "DD/MM/YYYY").toDate();

    const calculateAge = moment().diff(formattedDob, "years");

    candidate.jobPreferences = {
      profileTitle,
      jobType,
      preferredJobLocation,
      experienceYears,
      experienceMonths,
      gender,
      dob: formattedDob,
      age: calculateAge,
      maritalStatus,
      language,
      currentSalary,
      expectedSalary,
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
    const missingFields = [];

    if (!highestQualification) missingFields.push("employerId");
    if (!medium) missingFields.push("jobTitle");
    if (!boardOfEducation) missingFields.push("jobType");
    if (!percentage) missingFields.push("jobRole");
    if (!yearOfEducation) missingFields.push("minSalary");
    if (!educationMode) missingFields.push("maxSalary");

    if (missingFields.length > 0) {
      return res
        .status(400)
        .json({ message: `Missing fields: ${missingFields.join(", ")}` });
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
// export const updateCandidateProfile = async (req, res) => {
//   const { candidateId } = req.params;
//   const {
//     fullName,
//     email,
//     phone,
//     location,
//     minexp,
//     maxexp,
//     skills,
//     industry,
//     resume,
//     jobDescription,
//     terms,
//     profileTitle,
//     jobType,
//     gender,
//     dob,
//     maritalStatus,
//     language,
//     highestQualification,
//     medium,
//     boardOfEducation,
//     percentage,
//     yearOfEducation,
//     educationMode,
//   } = req.body;
//   const { profilePic, resumeFile } = req.files || {};

//   try {
//     const candidate = await Candidate.findById(candidateId);
//     if (!candidate) {
//       return res.status(404).json({ message: "Candidate not found" });
//     }

//     // Extract existing values from the candidate object if not passed
//     let profilePicUrl = candidate.registration.profilePic;
//     let resumeUrl = candidate.registration.resume;

//     const updatePromises = [];

//     // Handle file uploads if necessary
//     if (profilePic) {
//       await deleteFromCloudinary(
//         candidate.registration.profilePic.split("/").pop().split(".")[0]
//       );
//       updatePromises.push(
//         uploadToCloudinary(
//           profilePic[0].buffer,
//           "see_job_candidate_profile_pictures",
//           `profilePic_${candidateId}`
//         ).then((result) => {
//           profilePicUrl = result.secure_url;
//         })
//       );
//     }

//     if (resumeFile) {
//       await deleteFromCloudinary(
//         candidate.registration.resume.split("/").pop().split(".")[0]
//       );
//       updatePromises.push(
//         uploadToCloudinary(
//           resumeFile[0].buffer,
//           "see_job_candidate_resumes",
//           `resume_${candidateId}`
//         ).then((result) => {
//           resumeUrl = result.secure_url;
//         })
//       );
//     }

//     await Promise.all(updatePromises);

//     const updatedCandidate = await Candidate.findByIdAndUpdate(
//       candidateId,
//       {
//         registration: {
//           fullName: fullName || candidate.registration.fullName,
//           email: email || candidate.registration.email,
//           phone: phone || candidate.registration.phone,
//           location: location || candidate.registration.location,
//           minexp: minexp || candidate.registration.minexp,
//           maxexp: maxexp || candidate.registration.maxexp,
//           skills: skills || candidate.registration.skills,
//           industry: industry || candidate.registration.industry,
//           resume: resume || candidate.registration.resume,
//           jobDescription:
//             jobDescription || candidate.registration.jobDescription,
//           terms: terms || candidate.registration.terms,
//         },
//         jobPreferences: {
//           profileTitle: profileTitle || candidate.jobPreferences.profileTitle,
//           jobType: jobType || candidate.jobPreferences.jobType,
//           gender: gender || candidate.jobPreferences.gender,
//           dob: dob || candidate.jobPreferences.dob,
//           maritalStatus:
//             maritalStatus || candidate.jobPreferences.maritalStatus,
//           language: language || candidate.jobPreferences.language,
//         },
//         candidateEducation: {
//           highestQualification:
//             highestQualification ||
//             candidate.candidateEducation.highestQualification,
//           medium: medium || candidate.candidateEducation.medium,
//           boardOfEducation:
//             boardOfEducation || candidate.candidateEducation.boardOfEducation,
//           percentage: percentage || candidate.candidateEducation.percentage,
//           yearOfEducation:
//             yearOfEducation || candidate.candidateEducation.yearOfEducation,
//           educationMode:
//             educationMode || candidate.candidateEducation.educationMode,
//         },
//         profilePic: profilePicUrl,
//         resume: resumeUrl,
//       },
//       { new: true }
//     );

//     res.status(200).json({
//       message: "Profile updated successfully!",
//       candidate: updatedCandidate,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Failed to update profile." });
//   }
// };

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

export const updateProfilePic = async (req, res) => {
  const { userId } = req.params;

  const profilePic = req.files ? req.files.profilePic : null;

  if (!profilePic) {
    return res.status(400).json({ message: "Profile picture is required." });
  }

  const profilePicName = profilePic[0].originalname;

  try {
    const candidate = await Candidate.findById(userId);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    if (candidate.jobPreferences.profilePic) {
      const oldProfilePicUrl = candidate.jobPreferences.profilePic;
      const oldProfilePicPublicId = getCloudinaryPublicId(oldProfilePicUrl);

      if (oldProfilePicPublicId) {
        const deleteResult = await deleteFromCloudinary(oldProfilePicPublicId);
      } else {
        console.log("NOT DELETED");
      }
    }

    if (profilePic && profilePic.length > 0) {
      const [profilePicResult] = await Promise.all([
        uploadToCloudinary(
          profilePic[0].buffer,
          "see_job_candidate_profilePic",
          `${userId}/${profilePicName}`
        ),
      ]);
      candidate.jobPreferences.profilePic = profilePicResult.secure_url;
    }

    const response = await candidate.save();

    res.status(201).json({
      success: true,
      message: "Profile picture updated successfully!",
      data: response.jobPreferences.profilePic,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update profile picture." });
  }
};

export const updateResume = async (req, res) => {
  const { userId } = req.params;

  // Check if resume file is uploaded
  if (!req.files || !req.files.resume) {
    return res.status(400).json({ message: "Resume file is required." });
  }

  const { resume } = req.files;
  const resumeName = resume[0].originalname;

  try {
    // Find the candidate by userId
    const candidate = await Candidate.findById(userId);

    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found." });
    }

    // If there is an existing resume, remove it from Cloudinary
    if (candidate.registration.resume) {
      const oldResumeUrl = candidate.registration.resume;
      const oldResumePublicId = getCloudinaryPublicId(oldResumeUrl);

      if (oldResumePublicId) {
        const deleteResult = await deleteFromCloudinary(oldResumePublicId);
      } else {
        console.log("NOT DELETED");
      }
    }

    if (resume && resume.length > 0) {
      const [resumeResult] = await Promise.all([
        uploadToCloudinary(
          resume[0].buffer,
          "see_job_candidate_resumes",
          `${userId}/${resumeName}`
        ),
      ]);
      candidate.registration.resume = resumeResult.secure_url;
    }

    const response = await candidate.save();

    res.status(200).json({
      success: true,
      message: "Resume updated successfully!",
      data: response.registration.resume,
    });
  } catch (error) {
    console.error("Error during resume update:", error);
    res.status(500).json({ message: "Failed to update resume." });
  }
};

// ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
// ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
// ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
// ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
// ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
// ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
// ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
// ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
// ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
// ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

export const updatePersonalInfo = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const {
      fullName,
      email,
      phone,
      description,
      currentLocation,
      permanentAddress,
      gender,
      dob,
      age,
      maritalStatus,
    } = req.body;

    const updatedCandidate = await Candidate.findByIdAndUpdate(
      candidateId,
      {
        $set: {
          "personalInfo.fullName": fullName,
          "personalInfo.email": email,
          "personalInfo.phone": phone,
          "personalInfo.description": description,
          "personalInfo.currentLocation": currentLocation,
          "personalInfo.permanentAddress": permanentAddress,
          "personalInfo.gender": gender,
          "personalInfo.dob": dob,
          "personalInfo.age": age,
          "personalInfo.maritalStatus": maritalStatus,
        },
      },
      { new: true }
    );

    if (!updatedCandidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    res.status(200).json(updatedCandidate);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateJobPreference = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const { jobTitle, jobRoles, jobType, jobIndustry, jobLocation } = req.body;

    const updatedCandidate = await Candidate.findByIdAndUpdate(
      candidateId,
      {
        $set: {
          "jobPreferences.jobTitle": jobTitle,
          "jobPreferences.jobRoles": jobRoles,
          "jobPreferences.jobType": jobType,
          "jobPreferences.jobIndustry": jobIndustry,
          "jobPreferences.jobLocation": jobLocation,
        },
      },
      { new: true }
    );

    if (!updatedCandidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    res.status(200).json(updatedCandidate);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateEducation = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const { educationId } = req.body;
    const { degree, medium, board, percentage, startYear, passoutYear, mode } =
      req.body;

    const updatedCandidate = await Candidate.findByIdAndUpdate(
      candidateId,
      {
        $set: {
          "education.$[elem].degree": degree,
          "education.$[elem].medium": medium,
          "education.$[elem].board": board,
          "education.$[elem].percentage": percentage,
          "education.$[elem].startYear": startYear,
          "education.$[elem].passoutYear": passoutYear,
          "education.$[elem].mode": mode,
        },
      },
      {
        new: true,
        arrayFilters: [{ "elem._id": educationId }],
      }
    );

    if (!updatedCandidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    res.status(200).json(updatedCandidate);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateSkills = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const { skillId, skillName, proficiency } = req.body;

    const updatedCandidate = await Candidate.findByIdAndUpdate(
      candidateId,
      {
        $set: {
          "skills.$[elem].skillName": skillName,
          "skills.$[elem].proficiency": proficiency,
        },
      },
      {
        new: true,
        arrayFilters: [{ "elem._id": skillId }],
      }
    );

    if (!updatedCandidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    res.status(200).json(updatedCandidate);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateWorkExperience = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const {
      experienceId,
      companyName,
      jobTitle,
      startDate,
      endDate,
      currentlyEmployed,
      jobDescription,
      industry,
      location,
    } = req.body;

    const updatedCandidate = await Candidate.findByIdAndUpdate(
      candidateId,
      {
        $set: {
          "workExperience.$[elem].companyName": companyName,
          "workExperience.$[elem].jobTitle": jobTitle,
          "workExperience.$[elem].startDate": startDate,
          "workExperience.$[elem].endDate": endDate,
          "workExperience.$[elem].currentlyEmployed": currentlyEmployed,
          "workExperience.$[elem].jobDescription": jobDescription,
          "workExperience.$[elem].industry": industry,
          "workExperience.$[elem].location": location,
        },
      },
      {
        new: true,
        arrayFilters: [{ "elem._id": experienceId }],
      }
    );

    if (!updatedCandidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    res.status(200).json(updatedCandidate);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateAdditionalInfo = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const {
      noticePeriod,
      experience,
      currentSalary,
      expectedSalary,
      terms,
      role,
    } = req.body;

    const updatedCandidate = await Candidate.findByIdAndUpdate(
      candidateId,
      {
        $set: {
          "additionalInfo.noticePeriod": noticePeriod,
          "additionalInfo.experience.years": experience?.years,
          "additionalInfo.experience.months": experience?.months,
          "additionalInfo.currentSalary": currentSalary,
          "additionalInfo.expectedSalary": expectedSalary,
          "additionalInfo.terms": terms,
          "additionalInfo.role": role,
        },
      },
      { new: true }
    );

    if (!updatedCandidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    res.status(200).json(updatedCandidate);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const updateLanguages = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const { languageId, languageName, proficiency } = req.body;

    const updatedCandidate = await Candidate.findByIdAndUpdate(
      candidateId,
      {
        $set: {
          "language.$[elem].languageName": languageName,
          "language.$[elem].proficiency": proficiency,
        },
      },
      {
        new: true,
        arrayFilters: [{ "elem._id": languageId }],
      }
    );

    if (!updatedCandidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    res.status(200).json(updatedCandidate);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateSocialLinks = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const { linkedIn, github, portfolio } = req.body;

    const updatedCandidate = await Candidate.findByIdAndUpdate(
      candidateId,
      {
        $set: {
          "socialLinks.linkedIn": linkedIn,
          "socialLinks.github": github,
          "socialLinks.portfolio": portfolio,
        },
      },
      { new: true }
    );

    if (!updatedCandidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    res.status(200).json(updatedCandidate);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

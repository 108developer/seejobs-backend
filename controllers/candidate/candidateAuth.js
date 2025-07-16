import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import moment from "moment";
import Candidate from "../../models/candidate/candidateModel.js";
import Application from "../../models/jobs/application.js";
import JobListing from "../../models/jobs/jobsModel.js";
import Otp from "../../models/otp.js";
import { sendEmail } from "../../services/emailService.js";
import {
  deleteOTP,
  generateOTP,
  getStoredOTP,
  storeOTP,
} from "../../services/otpService.js";
import { bulkUploadCandidatesUtils } from "../../utils/bulkUploadUtils.js";
import {
  deleteFromCloudinary,
  uploadToCloudinary,
} from "../../utils/cloudinary.js";

const calculateAge = (dob) => {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

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
    console.error("No match found for URL", decodedUrl);
    return null;
  }
};

const normalizeList = (value) =>
  value
    ? value
        .split(/[,|&]/)
        .map((v) => v.trim())
        .filter(Boolean)
    : [];

const headerMap = {
  fullName: ["fullName", "Name of the Candidate"],
  gender: ["gender", "Gender"],
  location: ["location", "Current  Location"],
  preferredJobLocation: ["preferredJobLocation", "Preferred Location"],
  phone: ["phone", "Mobile No."],
  email: ["email", "Email"],
  permanentAddress: ["permanentAddress", "Postal Address"],
  skills: ["skills", "Key Skills"],
  experienceYears: ["experienceYears", "Work Experience"],
  qualification: ["highestQualification", "Qualification"],
};

export const bulkUploadCandidates = bulkUploadCandidatesUtils(
  headerMap, // <--- pass mapping instead of plain list
  Candidate,
  (row) => {
    const getField = (keys) => {
      for (const key of keys) {
        if (row?.[key]) return row[key];
      }
      return undefined;
    };

    const parseNumber = (val) => {
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    };

    return {
      registration: {
        fullName: getField(headerMap.fullName),
        email: getField(headerMap.email),
        phone: getField(headerMap.phone),
        location: getField(headerMap.location),
        permanentAddress: getField(headerMap.permanentAddress),
        skills: normalizeList(getField(headerMap.skills)),
        role: "candidate",
      },
      jobPreferences: {
        preferredJobLocation:
          getField(headerMap.preferredJobLocation)
            ?.split("&")
            .map((loc) => loc.trim())
            .filter(Boolean) || [],
        gender: getField(headerMap.gender),
        experience: {
          years: parseNumber(getField(headerMap.experienceYears)),
          months: parseNumber(row?.experienceMonths || row?.ExperienceMonths),
        },
      },
      candidateEducation: {
        highestQualification: getField(headerMap.qualification),
      },
      experienceYears: getField(headerMap.experienceYears),
    };
  }
);

const buildWelcomeEmail = ({ fullName, email, phone, plainPassword }) => {
  const text = `Hi ${fullName},

Welcome to SeeJob!

Your account has been successfully created. Here are your login details:

Email: ${email}
Phone: ${phone}
Password: ${plainPassword}

Visit your profile at: ${process.env.FRONTEND_URL}

Why SeeJob?

SeeJob is built with one mission: to help job seekers like you connect directly with top employers — faster, smarter, and with zero noise. Unlike other job finding platforms, we simplify your job search with real-time job alerts, skill-matching recommendations, and direct applications.

Get started today by visiting your profile, updating your resume, and exploring jobs designed just for you.

If your password doesn't work, simply use "Forgot Password" on the login screen to reset it easily.

We're excited to help you land your dream job!

Best regards,  
The SeeJob Team  
https://seejob.in`;

  const html = `
  <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', sans-serif; background-color: #f0f2f5; margin: 0; padding: 0; }
        .container { background-color: #ffffff; max-width: 600px; margin: 30px auto; padding: 30px; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
        h1 { color: #2c3e50; font-size: 24px; margin-bottom: 10px; }
        p { color: #555; line-height: 1.6; }
        .credentials { background-color: #f9f9f9; padding: 15px; border-left: 4px solid #007BFF; margin: 20px 0; border-radius: 5px; }
        .btn { background-color: #007BFF; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; margin-top: 20px; }
        .section-title { font-size: 18px; color: #333; margin-top: 30px; }
        .footer { text-align: center; font-size: 12px; color: #888; margin-top: 40px; }
        .highlight { color: #007BFF; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Welcome to SeeJob, ${fullName}!</h1>
        <p>We're excited to have you join India's fastest-growing job platform, <strong>SeeJob.in</strong>.</p>

        <div class="credentials">
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>Password:</strong> ${plainPassword}</p>
        </div>

        <p>To update your profile and start applying, click the button below:</p>
        <a href="${
          process.env.FRONTEND_URL
        }" class="btn">Go to Your Profile & Sign In</a>

        <h2 class="section-title">Why SeeJob?</h2>
        <p>
           Unlike other job finding platforms, SeeJob is <strong>focused entirely on candidate-first experiences</strong>:
        </p>
        <ul>
          <li>🔍 Smart job recommendations based on your skills</li>
          <li>⚡ Faster applications with no unnecessary steps</li>
          <li>🎯 Jobs curated for freshers, professionals, and specialists</li>
          <li>💬 Real-time alerts for matching opportunities</li>
        </ul>

        <p>It takes just minutes to complete your profile and apply to multiple jobs. We are here to guide you at every step.</p>
        <p>If you can’t log in with your password, use the “Forgot Password” option to reset it easily.</p>

        <p>Welcome again to the future of hiring. Let’s build your career together!</p>

        <p class="footer">
          &copy; ${new Date().getFullYear()} SeeJob | 
          <a href="https://seejob.in" style="color: #007BFF;">seejob.in</a> | All rights reserved
        </p>
      </div>
    </body>
  </html>
  `;

  return { text, html };
};

// Modal Sign Up Controller
export const signup = async (req, res) => {
  const { fullName, email, phone, password, location, gender, dob } = req.body;

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

    const currentYear = moment().format("YYYY");
    const countThisYear = await Candidate.countDocuments({
      profileID: { $regex: `^${currentYear}-` },
    });

    const profileID = `${currentYear}-${String(countThisYear + 1).padStart(
      2,
      "0"
    )}`;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newCandidate = new Candidate({
      profileID,
      registration: {
        fullName,
        email,
        phone,
        password: hashedPassword,
        location,
        role: "candidate",
      },
      jobPreferences: {
        gender,
        dob,
        age: dob ? calculateAge(dob) : null,
      },
      candidateEducation: {},
      workExperience: [],
    });

    await newCandidate.save();

    const token = jwt.sign(
      { userId: newCandidate._id, role: "candidate" },
      "your_jwt_secret",
      { expiresIn: "1h" }
    );

    const { text, html } = buildWelcomeEmail({
      fullName,
      email,
      phone,
      plainPassword: password,
    });

    res.status(201).json({
      success: true,
      message:
        "Candidate signed up successfully! Please complete your registration.",
      token,
      candidateId: newCandidate._id,
      profileID: newCandidate.profileID,
      email: newCandidate.registration.email,
      phone: newCandidate.registration.phone,
      fullName: newCandidate.registration.fullName,
      role: newCandidate.registration.role,
      expiresIn: "1h",
    });

    sendEmail({
      to: email,
      subject: "Welcome to SeeJob - Your Account Has Been Created for Job!",
      text,
      html,
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

export const uploadResume = async (req, res) => {
  const { fullName, email, phone, password } = req.body;
  const resume = req.files?.resume?.[0];

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

    const currentYear = moment().format("YYYY");
    const countThisYear = await Candidate.countDocuments({
      profileID: { $regex: `^${currentYear}-` },
    });

    const profileID = `${currentYear}-${String(countThisYear + 1).padStart(
      2,
      "0"
    )}`;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let resumeUrl = null;
    if (resume) {
      const resumeResult = await uploadToCloudinary(
        resume.buffer,
        "see_job_candidate_resumes",
        `${email}_resume`
      );
      resumeUrl = resumeResult.secure_url;
    }

    const newCandidate = new Candidate({
      profileID,
      registration: {
        fullName,
        email,
        phone,
        password: hashedPassword,
        role: "candidate",
        resume: resumeUrl,
      },
      jobPreferences: {},
      candidateEducation: {},
      workExperience: [],
    });

    await newCandidate.save();

    const token = jwt.sign(
      { userId: newCandidate._id, role: "candidate" },
      "your_jwt_secret",
      { expiresIn: "1h" }
    );

    const { text, html } = buildWelcomeEmail({
      fullName,
      email,
      phone,
      plainPassword: password,
    });

    sendEmail({
      to: email,
      subject: "Welcome to SeeJob - Your Account Has Been Created for Job!",
      text,
      html,
    });

    res.status(201).json({
      success: true,
      message: "Candidate registered successfully with resume!",
      token,
      candidateId: newCandidate._id,
      fullName: newCandidate.registration.fullName,
      email: newCandidate.registration.email,
      phone: newCandidate.registration.phone,
      role: newCandidate.registration.role,
      resume: resumeUrl,
      expiresIn: "1h",
    });
  } catch (error) {
    console.error("Error during resume upload:", error);
    res.status(500).json({ message: "Failed to register candidate." });
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

    candidate.registration.lastLogin = new Date();
    await candidate.save();

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
  const { jobId } = req.query;

  try {
    const candidate = await Candidate.findById(candidateId);

    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    const response = {
      profilePic: candidate.jobPreferences.profilePic || null,
      resume: candidate.registration.resume || null,
      registration: {
        candidateId: candidate._id,
        fullName: candidate.registration.fullName,
        email: candidate.registration.email,
        phone: candidate.registration.phone,
        location: candidate.registration.location,
        permanentAddress: candidate.registration.permanentAddress,
        yearExp: candidate.registration.yearExp,
        monthExp: candidate.registration.monthExp,
        skills: candidate.registration.skills,
        // industry: candidate.registration.industry,
        jobDescription: candidate.registration.jobDescription,
        terms: candidate.registration.terms,
        role: candidate.registration.role,
        resume: candidate.registration.resume || null,
      },
      jobPreferences: {
        profilePic: candidate.jobPreferences?.profilePic || "",
        profileTitle: candidate.jobPreferences?.profileTitle || "",
        jobType: candidate.jobPreferences?.jobType || "",
        preferredJobLocation:
          candidate.jobPreferences?.preferredJobLocation || [],
        gender: candidate.jobPreferences?.gender || "male",
        dob: candidate.jobPreferences?.dob,
        currentSalary: candidate.jobPreferences?.currentSalary || null,
        expectedSalary: candidate.jobPreferences?.expectedSalary || null,
        maritalStatus: candidate.jobPreferences?.maritalStatus || "",
        language: candidate.jobPreferences?.language || "",
        jobRoles: candidate.jobPreferences?.jobRoles || [],
      },
      candidateEducation: candidate.candidateEducation || [],
      workExperience: candidate.workExperience || [],
    };

    if (jobId) {
      const application = await Application.findOne({
        job: jobId,
        candidate: candidateId,
      });

      if (!application) {
        return res
          .status(404)
          .json({ message: "Application not found for this job" });
      }

      const job = await JobListing.findById(jobId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      const answers = (application.answers || []).map((answer) => {
        const question = job.questions.find(
          (q) => q._id.toString() === answer.questionId.toString()
        );
        return {
          questionId: answer.questionId,
          questionText: question ? question.questionText : "Unknown Question",
          answer: Array.isArray(answer.answer)
            ? answer.answer.join(", ")
            : answer.answer,
        };
      });

      response.questionnaire = answers;
    }

    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch candidate profile." });
  }
};

// Registration Controller - Step - 1
export const register = async (req, res) => {
  const requiredFields = [
    "candidateId",
    "permanentAddress",
    "yearExp",
    "monthExp",
    "profileTitle",
    "skills",
    "jobDescription",
    "terms",
  ];

  const missingFields = requiredFields.filter((field) => !req.body[field]);
  if (missingFields.length > 0) {
    return res.status(400).json({
      message: `Missing fields: ${missingFields.join(", ")}`,
    });
  }

  const {
    candidateId,
    permanentAddress,
    yearExp,
    monthExp,
    profileTitle,
    skills,
    jobDescription,
    terms,
  } = req.body;

  const { resume } = req.files || {};

  try {
    const candidate = await Candidate.findById(candidateId);

    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found." });
    }

    Object.assign(candidate.registration, {
      permanentAddress,
      yearExp,
      monthExp,
      skills: typeof skills === "string" ? JSON.parse(skills) : skills,
      jobDescription,
      terms,
    });

    candidate.jobPreferences = candidate.jobPreferences || {};
    candidate.jobPreferences.profileTitle = profileTitle;

    if (resume?.length > 0) {
      const [resumeResult] = await Promise.all([
        uploadToCloudinary(
          resume[0].buffer,
          "see_job_candidate_resumes",
          `${candidate.registration.email}_resume`
        ),
      ]);
      candidate.registration.resume = resumeResult.secure_url;
    }

    await candidate.save();

    return res.status(200).json({
      success: true,
      message: "Registration completed successfully!",
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res
      .status(500)
      .json({ message: "Failed to complete registration." });
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
    yearExp,
    monthExp,
    skills,
    // industry,
    jobDescription,
    terms,
  } = req.body;

  console.log("REQ: ", req.body);
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
    candidate.registration.yearExp = yearExp;
    candidate.registration.monthExp = monthExp;
    candidate.registration.skills = skills;
    // candidate.registration.industry = industry;
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
    // profileTitle,
    jobType,
    preferredJobLocation,
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

    let validJobType = Array.isArray(jobType) ? jobType : JSON.parse(jobType);

    let validLanguage = Array.isArray(language)
      ? language
      : JSON.parse(language);

    candidate.jobPreferences = {
      profilePic: profilePicResult ? profilePicResult.secure_url : null,
      // profileTitle,
      jobType: validJobType,
      preferredJobLocation: validPreferredJobLocation,
      maritalStatus,
      language: validLanguage,
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
    // experienceYears,
    // experienceMonths,
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
    // if (!experienceYears) missingFields.push("experienceYears");
    // if (!experienceMonths) missingFields.push("experienceMonths");

    if (missingFields.length > 0) {
      return res
        .status(400)
        .json({ message: `Missing fields: ${missingFields.join(", ")}` });
    }

    const candidate = await Candidate.findById(userId);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    const parsedDob = new Date(dob);
    if (isNaN(parsedDob)) {
      return res.status(400).json({ message: "Invalid date format for dob" });
    }

    const isoDob = parsedDob.toISOString();
    const age = moment().diff(parsedDob, "years");

    candidate.jobPreferences = {
      profileTitle,
      jobType,
      preferredJobLocation,
      // experienceYears,
      // experienceMonths,
      gender,
      dob: isoDob,
      age,
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
  try {
    const { candidateId, educationalEntries } = req.body;

    if (!candidateId || !Array.isArray(educationalEntries)) {
      return res.status(400).json({ message: "Invalid input" });
    }

    for (let entry of educationalEntries) {
      const { educationLevel, yearOfPassing, yearFrom, yearTo } = entry;

      if (
        ["High School", "Intermediate"].includes(educationLevel) &&
        !yearOfPassing
      ) {
        return res.status(400).json({
          message: `Year of Passing is required for ${educationLevel}`,
        });
      }

      if (
        !["High School", "Intermediate"].includes(educationLevel) &&
        (!yearFrom || !yearTo)
      ) {
        return res.status(400).json({
          message: `Year From and To are required for ${educationLevel}`,
        });
      }
    }

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    candidate.candidateEducation.push(...educationalEntries);
    await candidate.save();

    return res.status(201).json({
      success: true,
      message: "Educational details saved successfully!",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Update Educational Details Controller
export const updateEducationalDetails = async (req, res) => {
  const { userId } = req.params;
  const { educationalEntries } = req.body;

  if (!Array.isArray(educationalEntries)) {
    return res
      .status(400)
      .json({ message: "Invalid input. Must be an array." });
  }

  for (let entry of educationalEntries) {
    const { educationLevel, yearOfPassing, yearFrom, yearTo } = entry;

    if (
      ["High School", "Intermediate"].includes(educationLevel) &&
      !yearOfPassing
    ) {
      return res.status(400).json({
        message: `Year of Passing is required for ${educationLevel}`,
      });
    }

    if (
      !["High School", "Intermediate"].includes(educationLevel) &&
      (!yearFrom || !yearTo)
    ) {
      return res.status(400).json({
        message: `Year From and To are required for ${educationLevel}`,
      });
    }
  }

  const candidate = await Candidate.findById(userId);
  if (!candidate) {
    return res.status(404).json({ message: "Candidate not found" });
  }

  candidate.candidateEducation = educationalEntries;
  await candidate.save();

  res.status(200).json({
    success: true,
    message: "Educational details updated successfully!",
  });
};

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

    res.status(200).json(candidate.candidateEducation);
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
        console.error("NOT DELETED");
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
        console.error("NOT DELETED");
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

// Forgot Password
export const sendCandidateOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) res.status(400).json({ message: "Email reqired" });

  const existingCandidate = await Candidate.findOne({
    "registration.email": email,
  });

  if (!existingCandidate) {
    return res.status(400).json({ message: "Email does not exist" });
  }

  const identifier = `candidate:${email}`;

  const existingOtp = await Otp.findOne({ identifier });
  if (existingOtp) {
    const now = new Date();
    const expiresAt = new Date(existingOtp.expiresAt);
    const remainingTime = Math.max(0, expiresAt - now);

    return res.status(400).json({
      message: "OTP already sent. Please wait before retrying.",
      remainingTime,
    });
  }

  const otp = generateOTP();
  await storeOTP(`candidate:${email}`, otp);

  await sendEmail({
    to: email,
    subject: "OTP Verification",
    html: `<p>Your OTP is <strong>${otp}</strong></p>`,
  });

  res.json({ success: true, message: `OTP send to ${email}` });
};

export const verifyCandidateOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email) res.status(400).json({ message: "Email reqired" });

  const existingCandidate = await Candidate.findOne({
    "registration.email": email,
  });

  if (!existingCandidate) {
    return res.status(400).json({ message: "Email does not exist" });
  }

  const storedOtp = await getStoredOTP(`candidate:${email}`);

  if (!storedOtp)
    return res.status(400).json({ message: "OTP expired or not found" });

  if (storedOtp !== otp)
    return res.status(400).json({ message: "Invalid OTP. OTP did not match." });

  await deleteOTP(`candidate:${email}`);
  res.json({ success: true, message: "Candidate OTP verified successfully" });
};

export const resetCandidatePassword = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ mesage: "Email or Password missing" });

  try {
    const existingCandidate = await Candidate.findOne({
      "registration.email": email,
    });

    if (!existingCandidate) {
      return res.status(400).json({ message: "Email does not exist" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    existingCandidate.registration.password = hashedPassword;

    await existingCandidate.save();

    return res
      .status(200)
      .json({ success: true, message: "Password reset successful" });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ message: "Internal server error" });
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
          // "jobPreferences.jobIndustry": jobIndustry,
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

// Work Experience Controllers
export const getWorkExperience = async (req, res) => {
  const { candidateId } = req.params;

  try {
    const candidate = await Candidate.findById(candidateId).select(
      "workExperience"
    );

    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found." });
    }

    res.status(200).json(candidate.workExperience);
  } catch (error) {
    console.error("Error retrieving work experience:", error);
    res.status(500).json({ message: "Failed to retrieve work experience." });
  }
};

export const addWorkExperience = async (req, res) => {
  const { candidateId } = req.params;
  const newExperience = req.body;

  try {
    const candidate = await Candidate.findByIdAndUpdate(
      candidateId,
      { $push: { workExperience: newExperience } },
      { new: true }
    );

    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found." });
    }

    res.status(200).json(candidate);
  } catch (error) {
    console.error("Error adding work experience:", error);
    res.status(500).json({ message: "Failed to add work experience." });
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
      // industry,
      location,
      noticePeriod,
    } = req.body;

    const convertToISODate = (date) => {
      if (!date) return null;

      const parsedDate = new Date(date);

      if (parsedDate instanceof Date && !isNaN(parsedDate)) {
        return parsedDate.toISOString();
      }

      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (dateRegex.test(date)) {
        return new Date(date).toISOString();
      }

      return null;
    };

    const isoStartDate = convertToISODate(startDate);
    const isoEndDate = convertToISODate(endDate);

    const allowedNoticePeriods = [
      "Immediate",
      "15 Days",
      "30 Days",
      "45 Days",
      "60 Days",
      "75 Days",
      "90 Days",
    ];

    if (noticePeriod && !allowedNoticePeriods.includes(noticePeriod)) {
      return res.status(400).json({ message: "Invalid notice period value." });
    }

    const updatedCandidate = await Candidate.findByIdAndUpdate(
      candidateId,
      {
        $set: {
          "workExperience.$[elem].companyName": companyName,
          "workExperience.$[elem].jobTitle": jobTitle,
          "workExperience.$[elem].startDate": isoStartDate,
          "workExperience.$[elem].endDate": isoEndDate,
          "workExperience.$[elem].currentlyEmployed": currentlyEmployed,
          "workExperience.$[elem].jobDescription": jobDescription,
          // "workExperience.$[elem].industry": industry,
          "workExperience.$[elem].location": location,
          "workExperience.$[elem].noticePeriod": noticePeriod,
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

export const deleteWorkExperience = async (req, res) => {
  const { candidateId, experienceId } = req.params;

  try {
    const candidate = await Candidate.findByIdAndUpdate(
      candidateId,
      {
        $pull: { workExperience: { _id: experienceId } },
      },
      { new: true }
    );

    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found." });
    }

    res.status(200).json({
      message: "Work experience deleted successfully.",
      updatedWorkExperience: candidate.workExperience,
    });
  } catch (error) {
    console.error("Error deleting work experience:", error);
    res.status(500).json({ message: "Failed to delete work experience." });
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

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Employer from "../../models/employer/employerModel.js";
import Otp from "../../models/otp.js";
import { sendEmail } from "../../services/emailService.js";
import {
  deleteOTP,
  generateOTP,
  getStoredOTP,
  storeOTP,
} from "../../services/otpService.js";

export const register = async (req, res) => {
  const requiredFields = [
    "firstName",
    "lastName",
    "email",
    "mobileNumber",
    "password",
    "location",
    // "skills",
    "companyName",
    "designation",
    "address",
    // "city",
    // "zipCode",
    // "state",
    // "totalExperience",
    // "level",
    // "industry",
    // "achievements",
    "description",
  ];

  const missingFields = requiredFields.filter((field) => !req.body[field]);

  if (missingFields.length > 0) {
    return res.status(400).json({
      message: `Missing fields: ${missingFields.join(", ")}`,
    });
  }

  const {
    firstName,
    lastName,
    email,
    mobileNumber,
    password,
    location,
    // skills,
    companyName,
    designation,
    address,
    // city,
    // zipCode,
    // state,
    // totalExperience,
    // level,
    // industry,
    // achievements,
    description,
  } = req.body;

  try {
    const existingEmployer = await Employer.findOne({
      $or: [{ email: email }, { mobileNumber: mobileNumber }],
    });

    if (existingEmployer) {
      return res
        .status(400)
        .json({ message: "Email or Phone already exists." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newEmployer = new Employer({
      firstName,
      lastName,
      email,
      mobileNumber,
      password: hashedPassword,
      location,
      // skills,
      companyName,
      designation,
      address,
      // city,
      // zipCode,
      // state,
      // totalExperience,
      // level,
      // industry,
      // achievements,
      description,
      role: "employer",
      subscription: {
        plan: "Free",
        status: "Expired",
        allowedResume: 0,
        viewedResume: 0,
        startDate: null,
        endDate: null,
      },
    });

    await newEmployer.save();

    const token = jwt.sign(
      { userId: newEmployer._id, role: "employer" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(201).json({
      success: true,
      message:
        "Employer signed up successfully! Please complete your registration.",
      token,
      employerId: newEmployer._id,
      email: newEmployer.email,
      phone: newEmployer.mobileNumber,
      firstName: newEmployer.firstName,
      lastName: newEmployer.lastName,
      companyName: newEmployer.companyName,
      role: newEmployer.role,
      expiresIn: "1h",
    });
  } catch (error) {
    console.error("Error during employer signup:", error);
    res.status(500).json({ message: "Failed to register employer." });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email and password are required." });
  }

  try {
    const employer = await Employer.findOne({ email: email });
    if (!employer) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, employer.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: employer._id, role: employer.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({
      success: true,
      message: "Employer login successful!",
      token,
      userid: employer._id,
      email: employer.email,
      phone: employer.mobileNumber,
      firstName: employer.firstName,
      lastName: employer.lastName,
      companyName: employer.companyName,
      role: employer.role,
      expiresIn: "1h",
    });
  } catch (error) {
    console.error("Login Error: ", error);
    return res.status(500).json({ message: "Failed to log in." });
  }
};

export const getEmployerProfile = async (req, res) => {
  const { userid } = req.params;

  try {
    const employer = await Employer.findById(userid);

    if (!employer) {
      return res.status(404).json({ message: "Employer not found" });
    }
    res.status(200).json({
      success: true,
      message: "Employer Details Received",
      data: {
        firstName: employer.firstName,
        lastName: employer.lastName,
        email: employer.email,
        mobileNumber: employer.mobileNumber,
        location: employer.location,
        skills: employer.skills,
        companyName: employer.companyName,
        designation: employer.designation,
        address: employer.address,
        city: employer.city,
        zipCode: employer.zipCode,
        state: employer.state,
        totalExperience: employer.totalExperience,
        level: employer.level,
        // industry: employer.industry,
        achievements: employer.achievements,
        description: employer.description,
        role: employer.role,
        createdAt: employer.createdAt,
        updatedAt: employer.updatedAt,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to get employer profile",
    });
  }
};

export const updateRecruiter = async (req, res) => {
  const { userid } = req.params;

  const {
    firstName,
    lastName,
    email,
    mobileNumber,
    location,
    skills,
    companyName,
    designation,
    address,
    city,
    zipCode,
    state,
    totalExperience,
    level,
    // industry,
    achievements,
    description,
  } = req.body;

  try {
    const employer = await Employer.findById(userid);

    if (!employer) {
      return res.status(404).json({ message: "Employer not found" });
    }

    employer.firstName = firstName || employer.firstName;
    employer.lastName = lastName || employer.lastName;
    employer.email = email || employer.email;
    employer.mobileNumber = mobileNumber || employer.mobileNumber;
    employer.location = location || employer.location;
    employer.skills = skills || employer.skills;
    employer.companyName = companyName || employer.companyName;
    employer.designation = designation || employer.designation;
    employer.address = address || employer.address;
    employer.city = city || employer.city;
    employer.zipCode = zipCode || employer.zipCode;
    employer.state = state || employer.state;
    employer.totalExperience = totalExperience || employer.totalExperience;
    employer.level = level || employer.level;
    // employer.industry = industry || employer.industry;
    employer.achievements = achievements || employer.achievements;
    employer.description = description || employer.description;

    await employer.save();

    res.status(200).json({
      success: true,
      message: "Recruiter details updated successfully!",
    });
  } catch (error) {
    console.error("Error during updating recruiter:", error);
    res.status(500).json({ message: "Failed to update recruiter details." });
  }
};

export const sendEmployerOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: "Email Required" });

  const existingEmployer = await Employer.findOne({
    email: email,
  });

  if (!existingEmployer) {
    return res.status(400).json({ message: "Email does not exist" });
  }

  const identifier = `employer:${email}`;

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
  await storeOTP(`employer:${email}`, otp);

  await sendEmail({
    to: email,
    subject: "OTP Verification",
    html: `<p>Your OTP is <strong>${otp}</strong></p>`,
  });

  res.json({ success: true, message: `OTP sent to ${email}` });
};

export const verifyEmployerOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email) return res.status(400).json({ message: "Email Required" });

  const existingEmployer = await Employer.findOne({
    email: email,
  });

  if (!existingEmployer) {
    return res.status(400).json({ message: "Email does not exist" });
  }

  const storedOtp = await getStoredOTP(`employer:${email}`);

  if (!storedOtp)
    return res.status(400).json({ message: "Otp expired or not found" });

  if (storedOtp !== otp)
    return res.status(400).json({ message: "Invalid OTP. OTP did not match." });

  await deleteOTP(`employer:${email}`);
  res.json({ success: true, message: "Candidate OTP verified successfully" });
};

export const resetEmployerPassword = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ mesage: "Email or Password missing" });

  try {
    const existingEmployer = await Employer.findOne({
      email: email,
    });

    if (!existingEmployer) {
      return res.status(400).json({ message: "Email does not exist" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    existingEmployer.password = hashedPassword;

    await existingEmployer.save();

    return res
      .status(200)
      .json({ success: true, message: "Password reset successful" });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

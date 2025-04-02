import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Employer from "../../models/employer/employerModel.js";

export const register = async (req, res) => {
  console.log("REQUEST", req.body);
  const {
    firstName,
    lastName,
    email,
    mobileNumber,
    password,
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
    industry,
    achievements,
    description,
  } = req.body;

  try {
    if (
      !firstName ||
      !lastName ||
      !email ||
      !mobileNumber ||
      !password ||
      !location ||
      !skills ||
      !companyName ||
      !designation ||
      !address ||
      !city ||
      !zipCode ||
      !state ||
      !totalExperience ||
      !level ||
      !industry ||
      !achievements ||
      !description
    ) {
      return res.status(400).json({ message: "All fields are required." });
    }

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
      skills,
      companyName,
      designation,
      address,
      city,
      zipCode,
      state,
      totalExperience,
      level,
      industry,
      achievements,
      description,
      role: "employer",
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

// Employer Login Controller
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const employer = await Employer.findOne({ "registration.email": email });
    if (!employer) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(
      password,
      employer.registration.password
    );
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: employer._id },
      process.env.JWT_SECRET, // Use your secret key from environment variables
      { expiresIn: "1h" }
    );

    res.json({
      success: true,
      message: "Employer login successful!",
      token,
      employerId: employer._id,
      email: employer.registration.email,
      phone: employer.registration.mobileNumber,
      firstName: employer.registration.firstName,
      lastName: employer.registration.lastName,
      companyName: employer.registration.companyName,
      role: employer.registration.role,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to log in." });
  }
};

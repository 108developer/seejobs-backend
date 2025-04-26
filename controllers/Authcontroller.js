// controllers/authController.js

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Register from "../models/user/authModel.js";
// import cloudinary from "../config/cloudinaryConfig.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";

export const register = async (req, res) => {
  const { username, email, phone, password } = req.body;
  const { resume, profilePic } = req.files;

  const existingUser = await Register.findOne({ $or: [{ email }, { phone }] });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: "Email or Phone number already exists",
    });
  }

  try {
    // const profilePicResult = await uploadToCloudinary(
    //   profilePic[0].buffer,
    //   "see_job_candidate_profile_pictures",
    //   email + "_profilePic"
    // );

    // const resumeResult = await uploadToCloudinary(
    //   resume[0].buffer,
    //   "see_job_candidate_resumes",
    //   email + "_resume"
    // );

    // Parallelize the file upload and password hashing
    const [profilePicResult, resumeResult] = await Promise.all([
      uploadToCloudinary(
        profilePic[0].buffer,
        "see_job_candidate_profile_pictures",
        `${email}_profilePic`
      ),
      uploadToCloudinary(
        resume[0].buffer,
        "see_job_candidate_resumes",
        `${email}_resume`
      ),
    ]);

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new Register({
      username,
      password: hashedPassword,
      email,
      phone,
      profilePic: profilePicResult.secure_url,
      resume: resumeResult.secure_url,
      role: "user",
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: "User created successfully",
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({
      success: false,
      message: `Error while creating user: ${err.message}`,
    });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await Register.findOne({ email, role: "user" });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, "yourSecretKey", {
      expiresIn: "1h",
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
        expiresIn: "1h",
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const getSingleUser = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await Register.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    console.log("job", user);
    res.json({ success: true, user });
  } catch (error) {
    console.error("Error fetching job details:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getSeacthUser = async (req, res) => {
  try {
    const { role, location, skills, experienceMax, experienceMin } = req.query;

    const filter = {};

    if (role) {
      filter.industry = new RegExp(role, "i"); // Case-insensitive regex for 'role'
    }

    if (location) {
      filter.location = new RegExp(location, "i");
    }

    if (skills) {
      filter.skills = new RegExp(skills, "i");
    }

    if (experienceMax) {
      filter.maxExperience = { $lte: experienceMax };
    }

    if (experienceMin) {
      filter.minExperience = { $gte: experienceMin };
    }

    const user = await Register.find(filter);

    if (user.length > 0) {
      return res.status(200).send({
        success: true,
        user,
      });
    } else {
      return res.status(404).send({
        success: true,
        message: "no user found mathing your criteria",
      });
    }
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Error in the user job API",
      error: error.message,
    });
  }
};

// EDITED
export const updateUserProfile = async (req, res) => {
  const { userid } = req.params;

  // Destructure the body data
  const {
    username,
    email,
    phone,
    location,
    minExperience,
    maxExperience,
    skills,
    industry,
    description,
    company,
    salary,
    period,
    age,
    language,
  } = req.body;

  // Handle file uploads (resume and profilePic)
  const { resume, profilePic } = req.files || {}; // If no files, req.files will be undefined

  try {
    // Find user by ID
    const user = await Register.findById(userid);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Initialize file URLs (keep current ones if no new files uploaded)
    let profilePicUrl = user.profilePic;
    let resumeUrl = user.resume;

    // An array to store promises for file uploads (if files exist)
    const uploadPromises = [];

    if (profilePic) {
      // If profilePic is provided, delete the old one and upload the new one
      await deleteFromCloudinary(
        user.profilePic.split("/").pop().split(".")[0] // Extract the public ID from the URL
      );

      uploadPromises.push(
        uploadToCloudinary(
          profilePic[0].buffer,
          "see_job_candidate_profile_pictures",
          `profilePic_${userid}`
        ).then((result) => {
          profilePicUrl = result.secure_url;
        })
      );
    }

    if (resume) {
      // If resume is provided, delete the old one and upload the new one
      await deleteFromCloudinary(user.resume.split("/").pop().split(".")[0]);

      uploadPromises.push(
        uploadToCloudinary(
          resume[0].buffer,
          "see_job_candidate_resumes",
          `resume_${userid}`
        ).then((result) => {
          resumeUrl = result.secure_url;
        })
      );
    }

    // Wait for all the file uploads to finish (if any)
    await Promise.all(uploadPromises);

    // Update the user with the new data
    const updatedUser = await Register.findByIdAndUpdate(
      userid,
      {
        username: username || user.username,
        email: email || user.email,
        phone: phone || user.phone,
        location: location || user.location,
        minExperience: minExperience || user.minExperience,
        maxExperience: maxExperience || user.maxExperience,
        skills: skills || user.skills,
        industry: industry || user.industry,
        description: description || user.description,
        company: company || user.company,
        salary: salary || user.salary,
        period: period || user.period,
        age: age || user.age,
        language: language || user.language,
        profilePic: profilePicUrl, // Update the profilePic URL if it's changed
        resume: resumeUrl, // Update the resume URL if it's changed
      },
      { new: true } // Ensure that we return the updated user
    );

    // Return a success response with the updated user
    res.status(200).json({
      success: true,
      message: "User profile updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({
      success: false,
      message: `Error while updating user profile: ${err.message}`,
    });
  }
};

export const getCandidateProfile = async (req, res) => {
  const { userid } = req.params;

  try {
    const user = await Register.findById(userid);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      user: {
        username: user.username,
        email: user.email,
        phone: user.phone,
        location: user.location,
        minExperience: user.minExperience,
        maxExperience: user.maxExperience,
        skills: user.skills,
        industry: user.industry,
        description: user.description,
        profilePic: user.profilePic,
        resume: user.resume,
        company: user.company,
        salary: user.salary,
        period: user.period,
        age: user.age,
        language: user.language,
        qualification: user.qualification,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

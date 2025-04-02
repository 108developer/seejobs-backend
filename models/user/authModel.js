// models/Register.js
import mongoose from "mongoose";

const RegisterSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    phone: String,
    location: String,
    minExperience: Number,
    maxExperience: Number,
    skills: String,
    industry: String,
    description: String,
    password: String,
    profilePic: String,
    resume: String,
    company: String,
    salary: String,
    period: Number,
    age: Number,
    language: [String],
    qualification: String,

    role: {
      type: String,
      enum: ["user", "employer"],
      default: "user",
    },
  },

  {
    timestamps: true,
  }
);

const Register = mongoose.model("Register", RegisterSchema);

export default Register;

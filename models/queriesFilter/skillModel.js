// models/skillModel.js
import mongoose from "mongoose";

// Define the schema for skills
const skillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true, // Enforce uniqueness
  },
});

// Create the Skill model
const Skill = mongoose.model("Skill", skillSchema);

export default Skill;

// models/mediumModel.js
import mongoose from "mongoose";

// Define the schema for mediums
const mediumSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,  // Enforce uniqueness
  },
});

// Create the Medium model
const Medium = mongoose.model("Medium", mediumSchema);

export default Medium;

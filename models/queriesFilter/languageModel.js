import mongoose from "mongoose";

// Define the schema for languages
const languageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true, // Enforce uniqueness
  },
  code: {
    type: String,
    required: true,
    unique: true, // Enforce uniqueness (for language codes like 'en', 'fr', etc.)
  },
});

// Create the Language model
const Language = mongoose.model("Language", languageSchema);

export default Language;

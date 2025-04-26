// models/countryModel.js
import mongoose from "mongoose";

// Define the schema for countries
const countrySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true, // Enforce uniqueness
  },
});

// Create the Country model
const Country = mongoose.model("Country", countrySchema);

export default Country;

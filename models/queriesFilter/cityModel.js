// models/cityModel.js
import mongoose from "mongoose";

// Define the schema for cities
const citySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true, // Enforce uniqueness
  },
  state: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "State", // Reference to the State model
    required: true,
  },
});

// Create the City model
const City = mongoose.model("City", citySchema);

export default City;

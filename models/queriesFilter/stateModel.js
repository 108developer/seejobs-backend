// models/stateModel.js
import mongoose from "mongoose";

// Define the schema for states
const stateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true, // Enforce uniqueness
  },
  country: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Country", // Reference to the Country model
    required: true,
  },
});

// Create the State model
const State = mongoose.model("State", stateSchema);

export default State;

// /backend/models/Location.js
import mongoose from "mongoose";

const locationSchema = new mongoose.Schema({
    
  locality: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  pinCode: {
    type: String,
    required: true,
    unique: true,
  },
});

const Location = mongoose.model("Location", locationSchema);

export default Location;

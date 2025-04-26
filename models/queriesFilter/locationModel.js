// /backend/models/Location.js
import mongoose from "mongoose";

const locationSchema = new mongoose.Schema({
  locality: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  pinCode: { type: String, required: true },
});

// 👇 Add compound index
locationSchema.index(
  { locality: 1, city: 1, state: 1, country: 1, pinCode: 1 },
  { unique: true }
);

const Location = mongoose.model("Location", locationSchema);

export default Location;

// models/Degree.js
import mongoose from "mongoose";

const degreeSchema = new mongoose.Schema({
  value: {
    type: String,
    required: true,
    unique: true,
  },
  label: {
    type: String,
    required: true,
  },
});

const Degree = mongoose.model("Degree", degreeSchema);
export default Degree;

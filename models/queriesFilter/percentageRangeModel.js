// models/PercentageRange.js
import mongoose from "mongoose";

const percentageRangeSchema = new mongoose.Schema({
  value: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
});

const PercentageRange = mongoose.model(
  "PercentageRange",
  percentageRangeSchema
);
export default PercentageRange;

// Path : /models/queriesFilter/industriesModel.js
import mongoose from "mongoose";

const industrySchema = new mongoose.Schema({
  uniqueId: { type: String, required: true, unique: true },
  name: { type: String, required: true, unique: true },
  description: { type: String, required: false },
  createdAt: { type: Date, default: Date.now },
});

industrySchema.index({ uniqueId: 1 });
industrySchema.index({ name: 1 });

const Industry = mongoose.model("Industry", industrySchema);

export default Industry;

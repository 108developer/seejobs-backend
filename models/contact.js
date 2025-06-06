import mongoose from "mongoose";

const contactSchema = new mongoose.Schema({
  address: { type: String, required: true },
  email: { type: String, required: true },
  contact: { type: String, required: true },
  whatsapp: { type: String },
  linkedin: { type: String },
  instagram: { type: String },
  twitter: { type: String },
  facebook: { type: String },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Contact", contactSchema);

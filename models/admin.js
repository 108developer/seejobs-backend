import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  adminName: {
    type: String,
    required: true,
  },
  adminEmail: {
    type: String,
    required: true,
    unique: true,
  },
  adminPhone: {
    type: String,
    required: true,
  },
  adminPassword: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
    enum: ["admin", "moderator", "uploader"],
  },
});

const Admin = mongoose.model("Admin", adminSchema);

export default Admin;

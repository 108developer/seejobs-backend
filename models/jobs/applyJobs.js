import mongoose from "mongoose";

const aplyJobs = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  locality: { type: String, required: true },
  mobile: { type: String, required: true },
  currentCity: { type: String, required: true },
  speaksEnglish: { type: Boolean, required: true },
  isFresher: { type: Boolean, required: true },
  experience: { type: Number, required: true },
  gender: { type: String, required: true },
  ownsVehicle: { type: Boolean, required: true },
  resume: { type: String,  } 
});

export default mongoose.model('Applies', aplyJobs);

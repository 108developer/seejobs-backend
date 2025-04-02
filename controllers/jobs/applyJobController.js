import applyJobs from "../../models/jobs/applyJobs.js";
import path from "path";

export const applyJobsController = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Resume is required" });
    }

    const user = new applyJobs({
      name: req.body.name,
      email: req.body.email,
      locality: req.body.locality,
      mobile: req.body.mobile,
      currentCity: req.body.currentCity,
      speaksEnglish: req.body.speaksEnglish,
      isFresher: req.body.isFresher,
      experience: req.body.experience,
      gender: req.body.gender,
      ownsVehicle: req.body.ownsVehicle,
      resume: req.file.path,
    });

    res.status(201).send({
      message: "success",
      user,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

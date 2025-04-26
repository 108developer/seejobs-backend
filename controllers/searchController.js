import Skill from "../models/queriesFilter/skillModel.js";
import JobTitle from "../models/queriesFilter/jobTitleModel.js";
import Degree from "../models/queriesFilter/degreeModel.js";
import Medium from "../models/queriesFilter/mediumModel.js";
import PercentageRange from "../models/queriesFilter/percentageRangeModel.js"; // Assuming this is the correct path
import JobType from "../models/queriesFilter/jobTypeModel.js"; // Assuming this is the correct path

// Function to handle creation of new entries
const createEntry = async (Model, name) => {
  try {
    const existingEntry = await Model.findOne({ name });
    if (existingEntry) {
      throw new Error(`The entry "${name}" already exists.`);
    }
    const newEntry = new Model({ name });
    await newEntry.save();
    return newEntry;
  } catch (err) {
    throw new Error(err.message || "Error while creating the entry.");
  }
};

// Controller functions for different search categories

// Search Skills
export const searchSkills = async (req, res) => {
  const { query } = req.query;
  try {
    const results = await Skill.find({
      name: { $regex: query, $options: "i" },
    });
    res.json(results.map((item) => item.name));
  } catch (err) {
    console.error("Error searching skills:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Search Job Titles
export const searchJobTitles = async (req, res) => {
  const { query } = req.query;
  try {
    const results = await JobTitle.find({
      value: { $regex: query, $options: "i" },
    });
    res.json(results.map((item) => item.label));
  } catch (err) {
    console.error("Error searching job titles:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Search Degrees (Education Qualifications)
export const searchDegrees = async (req, res) => {
  const { query } = req.query;
  try {
    const results = await Degree.find({
      value: { $regex: query, $options: "i" },
    });
    res.json(results.map((item) => item.label));
  } catch (err) {
    console.error("Error searching degrees:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Search Medium
export const searchMedium = async (req, res) => {
  const { query } = req.query;
  try {
    const results = await Medium.find({
      name: { $regex: query, $options: "i" },
    });
    res.json(results.map((item) => item.name));
  } catch (err) {
    console.error("Error searching medium:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Search Percentage Ranges
export const searchPercentageRange = async (req, res) => {
  const { query } = req.query;
  try {
    const results = await PercentageRange.find({
      value: { $regex: query, $options: "i" },
    });
    res.json(results.map((item) => item.label));
  } catch (err) {
    console.error("Error searching percentage ranges:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Search Job Types
export const searchJobTypes = async (req, res) => {
  const { query } = req.query;
  try {
    const results = await JobType.find({
      value: { $regex: query, $options: "i" },
    });
    res.json(results.map((item) => item.label));
  } catch (err) {
    console.error("Error searching job types:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Endpoint for creating a new skill
export const createSkill = async (req, res) => {
  const { name } = req.body;
  try {
    const newSkill = await createEntry(Skill, name);
    res.json(newSkill);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Endpoint for creating a new job title
export const createJobTitle = async (req, res) => {
  const { name } = req.body;
  try {
    const newJobTitle = await createEntry(JobTitle, name);
    res.json(newJobTitle);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Endpoint for creating a new education qualification (Degree)
export const createDegree = async (req, res) => {
  const { name } = req.body;
  try {
    const newDegree = await createEntry(Degree, name);
    res.json(newDegree);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Endpoint for creating a new medium
export const createMedium = async (req, res) => {
  const { name } = req.body;
  try {
    const newMedium = await createEntry(Medium, name);
    res.json(newMedium);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Endpoint for creating a new percentage range
export const createPercentageRange = async (req, res) => {
  const { name } = req.body;
  try {
    const newPercentageRange = await createEntry(PercentageRange, name);
    res.json(newPercentageRange);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Endpoint for creating a new job type
export const createJobType = async (req, res) => {
  const { name } = req.body;
  try {
    const newJobType = await createEntry(JobType, name);
    res.json(newJobType);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

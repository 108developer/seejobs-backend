import Board from "../../models/queriesFilter/boardModel.js";
import Degree from "../../models/queriesFilter/degreeModel.js";
import Industry from "../../models/queriesFilter/industriesModel.js";
import JobTitle from "../../models/queriesFilter/jobTitleModel.js";
import Language from "../../models/queriesFilter/languageModel.js";
import Location from "../../models/queriesFilter/locationModel.js";
import Skill from "../../models/queriesFilter/skillModel.js";
import { bulkUploadUtils } from "../../utils/bulkUploadUtils.js";

// Skill Endpoints
// export const bulkUploadSkills = bulkUploadUtils(
//   ["name"],
//   Skill,
//   "name",
//   (row) => ({ name: row.name })
// );
export const bulkUploadSkills = async (req, res) => {
  try {
    const { skills } = req.body;

    if (!skills || typeof skills !== "string") {
      return res.status(400).json({
        success: false,
        message: "skills field is required as a string",
      });
    }

    // Split by comma, &, $, or newline, then clean
    const skillsArray = skills
      .split(/[,&$\n]+/)
      .map((skill) => skill.trim())
      .filter(Boolean);

    if (skillsArray.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid skills found in the input.",
      });
    }

    const duplicates = [];
    const addedSkills = [];

    for (const name of skillsArray) {
      const existing = await Skill.findOne({ name });

      if (existing) {
        duplicates.push(name);
        continue;
      }

      const newSkill = new Skill({ name });
      await newSkill.save();
      addedSkills.push(name);
    }

    res.status(201).json({
      success: true,
      message: `Added ${addedSkills.length} skills.`,
      duplicates,
    });
  } catch (error) {
    console.error("Bulk upload skills error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during bulk skill upload",
    });
  }
};

export const getSkills = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 30;
    const skip = (page - 1) * limit;

    const skills = await Skill.find().sort({ name: 1 }).skip(skip).limit(limit);

    const totalSkills = await Skill.countDocuments();
    const totalPages = Math.ceil(totalSkills / limit);

    res.status(200).json({
      success: true,
      message: "Skill fetched successfully!",
      currentPage: page,
      totalPages,
      totalSkills,
      skills,
    });
  } catch (error) {
    console.error("Error fetching skills:", error);
    res.status(500).json({ message: "Failed to fetch skills." });
  }
};

export const addSkill = async (req, res) => {
  const { name } = req.body;

  try {
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Name is required.",
      });
    }

    const existingSkill = await Skill.findOne({ name });

    if (existingSkill) {
      return res.status(400).json({
        success: false,
        message: "This skill already exists.",
      });
    }

    const newSkill = new Skill({ name });

    await newSkill.save();

    res.status(201).json({
      success: true,
      message: "Skill added successfully!",
      skill: newSkill,
    });
  } catch (error) {
    console.error("Error adding skill:", error);
    res.status(500).json({ message: "Failed to add skill." });
  }
};

export const updateSkill = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  try {
    if (!id || !name) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const existingSkill = await Skill.findOne({ name });

    if (existingSkill && existingSkill._id !== id) {
      return res.status(400).json({
        success: false,
        message: "A skill with this name already exists.",
      });
    }

    const updatedSkill = await Skill.findByIdAndUpdate(
      id,
      { name },
      { new: true }
    );

    if (!updatedSkill) {
      return res.status(404).json({ message: "Skill not found." });
    }

    res.status(200).json({
      success: true,
      message: "Skill updated successfully!",
      skill: updatedSkill,
    });
  } catch (error) {
    console.error("Error updating skill:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update skill." });
  }
};

export const deleteSkill = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedSkill = await Skill.findByIdAndDelete(id);

    if (!deletedSkill) {
      return res.status(404).json({ message: "Skill not found." });
    }

    res.status(200).json({
      success: true,
      message: "Skill deleted successfully!",
    });
  } catch (error) {
    console.error("Error deleting skill:", error);
    res.status(500).json({ message: "Failed to delete skill." });
  }
};

// Job Title Endpoints
// export const bulkUploadJobTitles = bulkUploadUtils(
//   ["label"],
//   JobTitle,
//   "value",
//   (row) => ({
//     label: row.label,
//     value: row.label?.replace(/\s+/g, "_").toLowerCase(),
//   })
// );
export const bulkUploadJobTitles = async (req, res) => {
  try {
    const { jobTitles } = req.body;

    if (!jobTitles || typeof jobTitles !== "string") {
      return res.status(400).json({
        success: false,
        message: "jobTitles field is required as a string",
      });
    }

    // Split string by comma, &, $, or newline, then trim and filter out empty
    const titlesArray = jobTitles
      .split(/[,&$\n]+/)
      .map((title) => title.trim())
      .filter(Boolean);

    if (titlesArray.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid job titles found in the input.",
      });
    }

    const duplicates = [];
    const addedJobTitles = [];

    for (const label of titlesArray) {
      const value = label.replace(/\s+/g, "_").toLowerCase();

      // Check if job title already exists
      const exists = await JobTitle.findOne({ value });
      if (exists) {
        duplicates.push(label);
        continue;
      }

      // Save new job title
      const newJobTitle = new JobTitle({ label, value });
      await newJobTitle.save();
      addedJobTitles.push(label);
    }

    res.status(201).json({
      success: true,
      message: `Added ${addedJobTitles.length} job titles.`,
      duplicates,
    });
  } catch (error) {
    console.error("Bulk upload error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during bulk upload",
    });
  }
};

export const getJobTitles = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 30;

    const skip = (page - 1) * limit;

    const jobTitles = await JobTitle.find()
      .sort({ value: 1 })
      .skip(skip)
      .limit(limit);

    const totalJobTitles = await JobTitle.countDocuments();
    const totalPages = Math.ceil(totalJobTitles / limit);

    res.status(200).json({
      success: true,
      message: "Job Title fetched successfully!",
      currentPage: page,
      totalPages,
      totalJobTitles,
      jobTitles,
    });
  } catch (error) {
    console.error("Error fetching job titles:", error);
    res.status(500).json({ message: "Failed to fetch job titles." });
  }
};

export const addJobTitle = async (req, res) => {
  const { label } = req.body;
  const value = label.replace(/\s+/g, "_").toLowerCase();

  try {
    if (!label) {
      return res.status(400).json({
        success: false,
        message: "Job title is required.",
      });
    }

    const existingJobTitle = await JobTitle.findOne({ value });

    if (existingJobTitle) {
      return res.status(400).json({
        success: false,
        message: "This Job Title already exists.",
      });
    }

    const newJobTitle = new JobTitle({ label, value });

    await newJobTitle.save();

    res.status(201).json({
      success: true,
      message: "Job title added successfully!",
      jobTitle: newJobTitle,
    });
  } catch (error) {
    console.error("Error adding job title:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to add job title." });
  }
};

export const updateJobTitle = async (req, res) => {
  const { _id, label } = req.body;
  const value = label.replace(/\s+/g, "_").toLowerCase();

  try {
    if (!_id || !label) {
      return res
        .status(400)
        .json({ success: false, message: "ID and label are required." });
    }

    const existingJobTitle = await JobTitle.findOne({ value });
    if (existingJobTitle && existingJobTitle._id.toString() !== _id) {
      return res.status(400).json({
        success: false,
        message: "This job title already exists.",
      });
    }

    const updatedJobTitle = await JobTitle.findByIdAndUpdate(
      _id,
      { label, value },
      { new: true }
    );

    if (!updatedJobTitle) {
      return res
        .status(404)
        .json({ success: false, message: "Job title not found." });
    }

    res.status(200).json({
      success: true,
      message: "Job title updated successfully!",
      jobTitle: updatedJobTitle,
    });
  } catch (error) {
    console.error("Error updating job title:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update job title.",
    });
  }
};

export const deleteJobTitle = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedJobTitle = await JobTitle.findByIdAndDelete(id);

    if (!deletedJobTitle) {
      return res.status(404).json({ message: "Job title not found." });
    }

    res.status(200).json({
      success: true,
      message: "Job title deleted successfully!",
    });
  } catch (error) {
    console.error("Error deleting job title:", error);
    res.status(500).json({ message: "Failed to delete job title." });
  }
};

// Degree Endpoints
export const bulkUploadDegrees = bulkUploadUtils(
  ["value", "label"],
  Degree,
  "value",
  (row) => ({ value: row.value, label: row.label })
);

export const getDegrees = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 30;
    const skip = (page - 1) * limit;

    const degrees = await Degree.find()
      .sort({ label: 1 })
      .skip(skip)
      .limit(limit);

    const totalDegrees = await Degree.countDocuments();
    const totalPages = Math.ceil(totalDegrees / limit);

    res.status(200).json({
      success: true,
      message: "Degrees fetched successfully!",
      currentPage: page,
      totalPages,
      totalDegrees,
      degrees,
    });
  } catch (error) {
    console.error("Error fetching degrees:", error);
    res.status(500).json({ message: "Failed to fetch degrees." });
  }
};

export const addDegree = async (req, res) => {
  const { value, label } = req.body;

  try {
    if (!value || !label) {
      return res.status(400).json({
        success: false,
        message: "Both value and label are required.",
      });
    }

    const existingDegree = await Degree.findOne({ value });

    if (existingDegree) {
      return res.status(400).json({
        success: false,
        message: "This degree already exists.",
      });
    }

    const newDegree = new Degree({
      value,
      label,
    });

    await newDegree.save();

    res.status(201).json({
      success: true,
      message: "Degree added successfully!",
      degree: newDegree,
    });
  } catch (error) {
    console.error("Error adding degree:", error);
    res.status(500).json({ success: false, message: "Failed to add degree." });
  }
};

export const updateDegree = async (req, res) => {
  const {} = req.params;
  const { value, label } = req.body;

  try {
    if (!value || !label) {
      return res
        .status(400)
        .json({ message: "Both value and label are required." });
    }

    const existingDegree = await Degree.findOne({ value });
    if (existingDegree && existingDegree._id.toString() !== id) {
      return res.status(400).json({
        success: false,
        message: "This degree already exists.",
      });
    }

    const updatedDegree = await Degree.findByIdAndUpdate(
      id,
      { value, label },
      { new: true }
    );

    if (!updatedDegree) {
      return res.status(404).json({ message: "Degree not found." });
    }

    res.status(200).json({
      success: true,
      message: "Degree updated successfully!",
      degree: updatedDegree,
    });
  } catch (error) {
    console.error("Error updating degree:", error);
    res.status(500).json({ message: "Failed to update degree." });
  }
};

export const deleteDegree = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedDegree = await Degree.findByIdAndDelete(id);

    if (!deletedDegree) {
      return res.status(404).json({ message: "Degree not found." });
    }

    res.status(200).json({
      success: true,
      message: "Degree deleted successfully!",
    });
  } catch (error) {
    console.error("Error deleting degree:", error);
    res.status(500).json({ message: "Failed to delete degree." });
  }
};

// Boards Endpoints
export const bulkUploadBoards = bulkUploadUtils(
  ["value", "label"],
  Board,
  "value",
  (row) => ({ value: row.value, label: row.label })
);

export const getBoards = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const boards = await Board.find()
      .sort({ label: 1 })
      .skip(skip)
      .limit(limit);

    const totalBoards = await Board.countDocuments();
    const totalPages = Math.ceil(totalBoards / limit);

    res.status(200).json({
      success: true,
      message: "Boards fetched successfully!",
      currentPage: page,
      totalPages,
      totalBoards,
      boards,
    });
  } catch (error) {
    console.error("Error fetching boards:", error);
    res.status(500).json({ message: "Failed to fetch boards." });
  }
};

export const addBoard = async (req, res) => {
  const { value, label } = req.body;

  try {
    if (!value || !label) {
      return res.status(400).json({
        success: false,
        message: "Both value and label are required.",
      });
    }

    const existingBoard = await Board.findOne({ value });

    if (existingBoard) {
      return res.status(400).json({
        success: false,
        message: "This board already exists.",
      });
    }

    const newBoard = new Board({
      value,
      label,
    });

    await newBoard.save();

    res.status(201).json({
      success: true,
      message: "Board added successfully!",
      board: newBoard,
    });
  } catch (error) {
    console.error("Error adding board:", error);
    res.status(500).json({ success: false, message: "Failed to add board." });
  }
};

export const updateBoard = async (req, res) => {
  const { id } = req.params;
  const { value, label } = req.body;

  try {
    if (!id || !value || !label) {
      return res.status(400).json({
        message: "Both value and label are required.",
      });
    }

    const existingBoard = await Board.findOne({ value });
    if (existingBoard && existingBoard._id.toString() !== id) {
      return res.status(400).json({
        success: false,
        message: "This board already exists.",
      });
    }

    const updatedBoard = await Board.findByIdAndUpdate(
      id,
      { value, label },
      { new: true }
    );

    if (!updatedBoard) {
      return res.status(404).json({ message: "Board not found." });
    }

    res.status(200).json({
      success: true,
      message: "Board updated successfully!",
      board: updatedBoard,
    });
  } catch (error) {
    console.error("Error updating board:", error);
    res.status(500).json({ message: "Failed to update board." });
  }
};

export const deleteBoard = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedBoard = await Board.findByIdAndDelete(id);

    if (!deletedBoard) {
      return res.status(404).json({ message: "Board not found." });
    }

    res.status(200).json({
      success: true,
      message: "Board deleted successfully!",
    });
  } catch (error) {
    console.error("Error deleting board:", error);
    res.status(500).json({ message: "Failed to delete board." });
  }
};

// Industry Endpoints
export const bulkUploadIndustries = bulkUploadUtils(
  ["name"],
  Industry,
  "name",
  (row) => ({ name: row.name })
);

export const getIndustries = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 30;
    const skip = (page - 1) * limit;

    const industries = await Industry.find()
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit);

    const totalIndustries = await Industry.countDocuments();
    const totalPages = Math.ceil(totalIndustries / limit);

    res.status(200).json({
      success: true,
      message: "Industries fetched successfully!",
      currentPage: page,
      totalPages,
      totalIndustries,
      industries,
    });
  } catch (error) {
    console.error("Error fetching industries:", error);
    res.status(500).json({ message: "Failed to fetch industries." });
  }
};

export const addIndustry = async (req, res) => {
  const { name } = req.body;

  try {
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Name is required.",
      });
    }

    const existingIndustry = await Industry.findOne({ name });

    if (existingIndustry) {
      return res.status(400).json({
        success: false,
        message: "This industry already exists.",
      });
    }

    const newIndustry = new Industry({ name });

    await newIndustry.save();

    res.status(201).json({
      success: true,
      message: "Industry added successfully!",
      industry: newIndustry,
    });
  } catch (error) {
    console.error("Error adding industry:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add industry.",
    });
  }
};

export const updateIndustry = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  try {
    if (!id || !name) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const existingIndustry = await Industry.findOne({ name });

    if (existingIndustry && existingIndustry._id !== id) {
      return res.status(400).json({
        success: false,
        message: "An industry with this name already exists.",
      });
    }

    const updatedIndustry = await Industry.findByIdAndUpdate(
      _id,
      { name },
      { new: true }
    );

    if (!updatedIndustry) {
      return res.status(404).json({ message: "Industry not found." });
    }

    res.status(200).json({
      success: true,
      message: "Industry updated successfully!",
      industry: updatedIndustry,
    });
  } catch (error) {
    console.error("Error updating industry:", error);
    res.status(500).json({ message: "Failed to update industry." });
  }
};

export const deleteIndustry = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedIndustry = await Industry.findByIdAndDelete(id);

    if (!deletedIndustry) {
      return res.status(404).json({ message: "Industry not found." });
    }

    res.status(200).json({
      success: true,
      message: "Industry deleted successfully!",
    });
  } catch (error) {
    console.error("Error deleting industry:", error);
    res.status(500).json({ message: "Failed to delete industry." });
  }
};

// Language Endpoints
export const bulkUploadLanguages = bulkUploadUtils(
  ["name"],
  Language,
  "name",
  (row) => ({ name: row.name })
);

export const getLanguages = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const languages = await Language.find()
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit);

    const totalLanguages = await Language.countDocuments();
    const totalPages = Math.ceil(totalLanguages / limit);

    res.status(200).json({
      success: true,
      message: "Languages fetched successfully!",
      currentPage: page,
      totalPages,
      totalLanguages,
      languages,
    });
  } catch (error) {
    console.error("Error fetching languages:", error);
    res.status(500).json({ message: "Failed to fetch languages." });
  }
};

export const addLanguage = async (req, res) => {
  const { name } = req.body;

  try {
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Name is required.",
      });
    }

    const existingLanguage = await Language.findOne({ name });

    if (existingLanguage) {
      return res.status(400).json({
        success: false,
        message: "This language already exists.",
      });
    }

    const newLanguage = new Language({ name });

    await newLanguage.save();

    res.status(201).json({
      success: true,
      message: "Language added successfully!",
      language: newLanguage,
    });
  } catch (error) {
    console.error("Error adding language:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add language.",
    });
  }
};

export const updateLanguage = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  try {
    if (!id || !name) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const existingLanguage = await Language.findOne({ name });

    if (existingLanguage && existingLanguage._id !== id) {
      return res.status(400).json({
        success: false,
        message: "A language with this name already exists.",
      });
    }

    const updatedLanguage = await Language.findByIdAndUpdate(
      _id,
      { name },
      { new: true }
    );

    if (!updatedLanguage) {
      return res.status(404).json({ message: "Language not found." });
    }

    res.status(200).json({
      success: true,
      message: "Language updated successfully!",
      language: updatedLanguage,
    });
  } catch (error) {
    console.error("Error updating language:", error);
    res.status(500).json({ message: "Failed to update language." });
  }
};

export const deleteLanguage = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedLanguage = await Language.findByIdAndDelete(id);

    if (!deletedLanguage) {
      return res.status(404).json({ message: "Language not found." });
    }

    res.status(200).json({
      success: true,
      message: "Language deleted successfully!",
    });
  } catch (error) {
    console.error("Error deleting language:", error);
    res.status(500).json({ message: "Failed to delete language." });
  }
};

// Locations Endpoints
export const bulkUploadLocations = bulkUploadUtils(
  ["locality", "city", "state", "country", "pincode"],
  Location,
  "pinCode",
  (row) => ({
    locality: row.locality || row.Locality,
    city: row.city || row.City,
    state: row.state || row.State,
    country: row.country || row.Country,
    pinCode: row.pincode || row.Pincode,
  })
);

export const addLocation = async (req, res) => {
  const { locality, city, state, country, pinCode } = req.body;

  try {
    const existingLocation = await Location.findOne({ pinCode });
    if (existingLocation) {
      return res.status(400).json({
        success: false,
        message: "Location with this pinCode already exists.",
      });
    }

    const newLocation = new Location({
      locality,
      city,
      state,
      country,
      pinCode,
    });
    await newLocation.save();

    res.status(201).json({
      success: true,
      message: "Location added successfully!",
      location: newLocation,
    });
  } catch (error) {
    console.error("Error adding location:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to add location." });
  }
};

export const getLocation = async (req, res) => {
  const { id } = req.params;

  try {
    const location = await Location.findById(id);

    if (!location) {
      return res
        .status(404)
        .json({ success: false, message: "Location not found." });
    }

    res.status(200).json({ success: true, location });
  } catch (error) {
    console.error("Error fetching location:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch location." });
  }
};

export const getLocations = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 25;
    const skip = (page - 1) * limit;

    const locations = await Location.find()
      .sort({ country: 1, state: 1, city: 1, locality: 1 })
      .skip(skip)
      .limit(limit);
    const totalLocations = await Location.countDocuments();
    const totalPages = Math.ceil(totalLocations / limit);

    res.status(200).json({
      success: true,
      message: "Locations fetched successfully!",
      currentPage: page,
      totalPages,
      totalLocations,
      locations,
    });
  } catch (error) {
    console.error("Error fetching locations:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch locations." });
  }
};

export const updateLocation = async (req, res) => {
  const { id } = req.params;
  const { locality, city, state, country, pinCode } = req.body;

  try {
    const updatedLocation = await Location.findByIdAndUpdate(
      id,
      { locality, city, state, country, pinCode },
      { new: true }
    );

    if (!updatedLocation) {
      return res
        .status(404)
        .json({ success: false, message: "Location not found." });
    }

    res.status(200).json({
      success: true,
      message: "Location updated successfully!",
      location: updatedLocation,
    });
  } catch (error) {
    console.error("Error updating location:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update location." });
  }
};

export const deleteLocation = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedLocation = await Location.findByIdAndDelete(id);

    if (!deletedLocation) {
      return res
        .status(404)
        .json({ success: false, message: "Location not found." });
    }

    res
      .status(200)
      .json({ success: true, message: "Location deleted successfully!" });
  } catch (error) {
    console.error("Error deleting location:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete location." });
  }
};

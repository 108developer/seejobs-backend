import jwt from "jsonwebtoken";
import Admin from "../../models/admin.js";
import Employer from "../../models/employer/employerModel.js";
import JobListing from "../../models/jobs/jobsModel.js";
import Seo from "../../models/seo.js";
import Register from "../../models/user/authModel.js";

// GET SEO
export const getSeo = async (req, res) => {
  try {
    const { page } = req.query;

    if (page) {
      const seoEntry = await Seo.findOne({ page });
      if (!seoEntry) {
        return res
          .status(404)
          .json({ success: false, message: `No SEO found for page: ${page}` });
      }

      return res.status(200).json({
        success: true,
        message: "SEO entry fetched successfully",
        data: seoEntry,
      });
    }

    const allSeoEntries = await Seo.find();

    return res.status(200).json({
      success: true,
      message: "All SEO entries fetched successfully",
      data: allSeoEntries,
    });
  } catch (error) {
    console.error("Error fetching SEO entries:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// GET SEO BY PAGE
export const getSeoByPage = async (req, res) => {
  try {
    const { page } = req.params;

    if (!page) {
      return res.status(400).json({
        success: false,
        message: "Page parameter is required",
      });
    }

    const seoEntry = await Seo.findOne({ page });

    if (!seoEntry) {
      return res.status(404).json({
        success: false,
        message: `No SEO data found for page: ${page}`,
      });
    }

    return res.status(200).json({
      success: true,
      message: "SEO data fetched successfully",
      data: seoEntry,
    });
  } catch (error) {
    console.error("Error fetching SEO data:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// CREATE SEO
export const createSeo = async (req, res) => {
  try {
    const {
      page,
      metaTitle,
      metaDescription,
      metaKeywords,
      canonicalUrl,
      robots,
      og,
      twitter,
      structuredData,
    } = req.body;

    // Validate required fields
    if (!page || !metaTitle || !metaDescription || !metaKeywords) {
      return res.status(400).json({
        success: false,
        message:
          "page, metaTitle, metaDescription, and metaKeywords are required.",
      });
    }

    // Check for duplicate page or title
    const existingPage = await Seo.findOne({ page });
    if (existingPage) {
      return res
        .status(400)
        .json({ message: "SEO for this page already exists" });
    }

    const existingTitle = await Seo.findOne({ metaTitle });
    if (existingTitle) {
      return res.status(400).json({ message: "SEO title already exists" });
    }

    // Only accept valid robots values, otherwise use default
    const validRobots = [
      "index, follow",
      "noindex, follow",
      "index, nofollow",
      "noindex, nofollow",
    ];

    const sanitizedRobots = validRobots.includes(robots)
      ? robots
      : "index, follow";

    // Sanitize optional fields
    const sanitizedOg = {
      title: og?.title || "",
      description: og?.description || "",
      url: og?.url || "",
      type: og?.type || "",
      image: og?.image || "",
    };

    const sanitizedTwitter = {
      card: twitter?.card || "",
      title: twitter?.title || "",
      description: twitter?.description || "",
      image: twitter?.image || "",
    };

    const newSeo = new Seo({
      page,
      metaTitle,
      metaDescription,
      metaKeywords,
      canonicalUrl: canonicalUrl || "",
      robots: sanitizedRobots,
      og: sanitizedOg,
      twitter: sanitizedTwitter,
      structuredData: structuredData || "",
    });

    await newSeo.save();

    return res.status(201).json({
      success: true,
      message: "SEO entry created successfully",
      data: newSeo,
    });
  } catch (error) {
    console.error("Error creating SEO entry:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// UPDATE SEO
export const updateSeo = async (req, res) => {
  try {
    const { page } = req.params;
    const {
      metaTitle,
      metaDescription,
      metaKeywords,
      canonicalUrl,
      robots,
      og,
      twitter,
      structuredData,
    } = req.body;

    const existingSeo = await Seo.findOne({ page });
    if (!existingSeo) {
      return res
        .status(404)
        .json({ success: false, message: "Page not found" });
    }

    const existingTitle = await Seo.findOne({ metaTitle, page: { $ne: page } });
    if (existingTitle) {
      return res
        .status(400)
        .json({ success: false, message: "SEO title already exists" });
    }

    existingSeo.metaTitle = metaTitle;
    existingSeo.metaDescription = metaDescription;
    existingSeo.metaKeywords = metaKeywords;
    existingSeo.canonicalUrl = canonicalUrl;
    existingSeo.robots = robots;
    existingSeo.og = og;
    existingSeo.twitter = twitter;
    existingSeo.structuredData = structuredData;

    await existingSeo.save();

    return res.status(200).json({
      success: true,
      message: "SEO updated successfully",
      data: existingSeo,
    });
  } catch (error) {
    console.error("Error updating SEO:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// DELETE SEO
export const deleteSeo = async (req, res) => {
  try {
    const { page } = req.params;

    const existingPage = await Seo.findOne({ page });
    if (!existingPage) {
      return res.status(404).json({ message: "Page not found" });
    }

    await Seo.deleteOne({ page });

    return res.status(200).json({
      success: true,
      message: `SEO entry for page '${page}' deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting SEO:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ adminEmail: email });
    if (!admin) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (admin.adminPassword !== password) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: admin._id }, "yourSecretKey", {
      expiresIn: "1h",
    });

    res.json({
      success: true,
      message: "Admin login successful!",
      token,
      adminId: admin._id,
      adminName: admin.adminName,
      adminEmail: admin.adminEmail,
      adminPhone: admin.adminPhone,
      role: "admin",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to log in." });
  }
};

export const currentUsers = async (req, res) => {
  try {
    const jobCount = await Register.countDocuments();
    const userData = await Register.find().sort({ data: 1 });

    if (jobCount === 0) {
      res.status(200).send({
        success: true,
        message: "No jobs are available",
      });
    } else {
      res.status(200).send({
        success: true,
        jobs: jobCount,
        userData: userData,
      });
    }
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};

export const currentJobs = async (req, res) => {
  try {
    const jobCount = await JobListing.countDocuments();
    const jobData = await JobListing.find().sort({ date: 1 });

    if (jobCount === 0) {
      res.status(200).send({
        success: true,
        message: "No jobs are available",
      });
    } else {
      res.status(200).send({
        success: true,
        jobs: jobCount,
        jobData: jobData,
      });
    }
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in getting number of jobs",
    });
  }
};

export const currentEmlpoyers = async (req, res) => {
  try {
    const jobCount = await Employer.countDocuments();
    const EmployerData = await Employer.find().sort({ date: 1 });

    if (jobCount === 0) {
      res.status(200).send({
        success: true,
        message: "No jobs are available",
      });
    } else {
      res.status(200).send({
        success: true,
        jobs: jobCount,
        Employer: EmployerData,
      });
    }
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in getting number of jobs",
    });
  }
};

export const getTodaysJobPostings = async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const todaysJobs = await JobListing.countDocuments({
      createdAt: {
        $gte: startOfToday,
        $lt: endOfToday,
      },
    });

    const todaysJobsData = await JobListing({
      createdAt: {
        $gte: startOfToday,
        $lt: endOfToday,
      },
    });

    res.status(200).send({
      success: true,
      jobs: todaysJobs,
      todaysJobsData: todaysJobsData,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in getting today's job postings",
      error: error.message,
    });
  }
};

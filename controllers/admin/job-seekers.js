import Candidate from "../../models/candidate/candidateModel.js";
import JobListing from "../../models/jobs/jobsModel.js";

export const getAllJobSeekers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      sortBy = "updatedAt",
      sortOrder = "desc",
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Supported sort fields mapping
    const sortFieldMap = {
      name: "registration.fullName",
      fullName: "registration.fullName",
      email: "registration.email",
      phone: "registration.phone",
      location: "registration.location",
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    };

    const sortField = sortFieldMap[sortBy] || "updatedAt";

    const sortDirection = sortOrder === "desc" ? -1 : 1;

    const baseFilter = {};

    if (["fullName", "email", "phone", "location"].includes(sortBy)) {
      const fieldPath = sortFieldMap[sortBy];
      baseFilter[fieldPath] = { $regex: ".*\\S.*", $exists: true };
    }

    const searchFilter = search
      ? {
          $and: [
            baseFilter,
            {
              $or: [
                { "registration.fullName": { $regex: search, $options: "i" } },
                { "registration.email": { $regex: search, $options: "i" } },
                { "registration.phone": { $regex: search, $options: "i" } },
                { "registration.location": { $regex: search, $options: "i" } },
              ],
            },
          ],
        }
      : baseFilter;

    const [total, data] = await Promise.all([
      Candidate.countDocuments(searchFilter),
      Candidate.find(searchFilter)
        .sort({ [sortField]: sortDirection })
        .collation({ locale: "en", strength: 2 })
        .skip(skip)
        .limit(parseInt(limit))
        .select({
          _id: 1,
          profileID: 1,
          "registration.fullName": 1,
          "registration.email": 1,
          "registration.phone": 1,
          "registration.location": 1,
          "registration.permanentAddress": 1,
          "jobPreferences.age": 1,
          "jobPreferences.gender": 1,
          createdAt: 1,
          updatedAt: 1,
        }),
    ]);

    const jobSeekers = data.map((item) => ({
      candidateId: item._id,
      profileID: item.profileID,
      fullName: item.registration?.fullName || "",
      email: item.registration?.email || "",
      phone: item.registration?.phone || "",
      location: item.registration?.location || "",
      permanentAddress: item.registration?.permanentAddress || "",
      age: item.jobPreferences?.age || null,
      gender: item.jobPreferences?.gender || "",
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    return res.status(200).json({
      success: true,
      data: jobSeekers,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Internal Error : ", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

export const getAllJobs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      sortBy = "updatedAt",
      sortOrder = "desc",
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortDirection = sortOrder === "desc" ? -1 : 1;

    const searchRegex = new RegExp(search, "i");

    const searchFilter = search
      ? {
          $or: [
            { jobTitle: searchRegex },
            { jobLocation: searchRegex },
            { "employer.firstName": searchRegex },
            { companyName: searchRegex },
            { companyEmail: searchRegex },
            { companyPhone: searchRegex },
            { companyWebsite: searchRegex },
          ],
        }
      : {};

    const [total, data] = await Promise.all([
      JobListing.countDocuments(searchFilter),
      JobListing.find(searchFilter)
        .populate("employer", "firstName lastName email mobileNumber")
        .sort({ [sortBy]: sortDirection })
        .skip(skip)
        .limit(parseInt(limit))
        .select(
          "_id jobTitle jobLocation deadline employer companyName companyEmail companyPhone companyWebsite"
        ),
    ]);

    const jobs = data.map((job) => ({
      id: job._id,
      jobTitle: job.jobTitle,
      jobLocation: job.jobLocation,
      deadline: job.deadline,
      employer: {
        id: job.employer?._id,
        firstName: job.employer?.firstName || "",
        lastName: job.employer?.lastName || "",
        email: job.employer?.email || "",
        mobileNumber: job.employer?.mobileNumber || "",
      },
      company: {
        companyName: job.companyName || "",
        companyEmail: job.companyEmail || "",
        companyPhone: job.companyPhone || "",
        companyWebsite: job.companyWebsite || "",
      },
    }));

    return res.status(200).json({
      success: true,
      data: jobs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Internal Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

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

    const pipeline = [
      {
        $lookup: {
          from: "employers",
          localField: "employer",
          foreignField: "_id",
          as: "employer",
        },
      },
      { $unwind: { path: "$employer", preserveNullAndEmptyArrays: true } },
    ];

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { jobTitle: searchRegex },
            { jobLocation: searchRegex },
            { "employer.firstName": searchRegex },
            { "employer.lastName": searchRegex },
            { companyName: searchRegex },
            { companyEmail: searchRegex },
            { companyPhone: searchRegex },
            { companyWebsite: searchRegex },
          ],
        },
      });
    }

    const countPipeline = [...pipeline, { $count: "total" }];
    const countResult = await JobListing.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    const sortFieldsMap = {
      jobTitle: "jobTitle",
      jobLocation: "jobLocation",
      deadline: "deadline",
      createdAt: "createdAt",
      companyName: "companyName",
      companyEmail: "companyEmail",
      companyPhone: "companyPhone",
      "employer.firstName": "employer.firstName",
      "employer.lastName": "employer.lastName",
      employerEmail: "employer.email",
      employerPhone: "employer.mobileNumber",
    };

    const sortField = sortFieldsMap[sortBy] || "updatedAt";

    pipeline.push({ $sort: { [sortField]: sortDirection } });
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: parseInt(limit) });
    pipeline.push({
      $project: {
        _id: 1,
        jobTitle: 1,
        jobLocation: 1,
        deadline: 1,
        companyName: 1,
        companyEmail: 1,
        companyPhone: 1,
        companyWebsite: 1,
        url: 1,
        status: 1,
        createdAt: 1,
        employer: {
          _id: "$employer._id",
          firstName: "$employer.firstName",
          lastName: "$employer.lastName",
          email: "$employer.email",
          mobileNumber: "$employer.mobileNumber",
        },
      },
    });

    const data = await JobListing.aggregate(pipeline);

    const jobs = data.map((job) => ({
      id: job._id,
      jobTitle: job.jobTitle,
      jobLocation: job.jobLocation,
      url: job.url,
      status: job.status,
      createdAt: job.createdAt,
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
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

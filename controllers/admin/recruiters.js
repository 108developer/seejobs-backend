// jobs/expirePlansCron.js
import cron from "node-cron";
import Employer from "../../models/employer/employerModel.js";
import { sendEmail } from "../../services/emailService.js";

export const getAllRecruiters = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      sortBy = "updatedAt",
      sortOrder = "desc",
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortFieldMap = {
      name: "firstName", // Could use a computed full name in future
      email: "email",
      phone: "mobileNumber",
      location: "location",
      company: "companyName",
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    };

    const sortField = sortFieldMap[sortBy] || "updatedAt";
    const sortDirection = sortOrder === "desc" ? -1 : 1;

    const searchFilter = search
      ? {
          $or: [
            { firstName: { $regex: search, $options: "i" } },
            { lastName: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { mobileNumber: { $regex: search, $options: "i" } },
            { location: { $regex: search, $options: "i" } },
            { companyName: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const [total, employers] = await Promise.all([
      Employer.countDocuments(searchFilter),
      Employer.find(searchFilter)
        .sort({ [sortField]: sortDirection })
        .skip(skip)
        .limit(parseInt(limit))
        .select({
          _id: 1,
          firstName: 1,
          lastName: 1,
          email: 1,
          mobileNumber: 1,
          location: 1,
          companyName: 1,
          subscription: 1,
          createdAt: 1,
          updatedAt: 1,
        }),
    ]);

    const recruiters = employers.map((item) => ({
      id: item._id,
      fullName: `${item.firstName || ""} ${item.lastName || ""}`.trim(),
      email: item.email || "",
      mobileNumber: item.mobileNumber || "",
      location: item.location || "",
      companyName: item.companyName || "",
      subscription: item.subscription || "",
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    return res.status(200).json({
      success: true,
      data: recruiters,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Internal Error: ", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const updatePlan = async (req, res) => {
  try {
    const { plan, status, startDate, endDate, allowedResume } = req.body;
    const { id } = req.query;

    const updatedPlan = await Employer.findByIdAndUpdate(
      id,
      {
        $set: {
          "subscription.plan": plan,
          "subscription.status": status || "Active",
          "subscription.startDate": startDate,
          "subscription.endDate": endDate,
          "subscription.allowedResume": allowedResume || 1000,
        },
      },
      { new: true }
    );

    if (!updatedPlan) {
      return res.status(404).json({ message: "Recruiter not found" });
    }

    res.status(200).json(updatedPlan.subscription);
  } catch (error) {
    console.error("Error : ", error);
    return res.status(500).json({ message: "Invalid Server Error" });
  }
};

export const startPlanExpiryCron = () => {
  cron.schedule("0 0 * * *", async () => {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const expiredEmployers = await Employer.find({
        status: { $ne: "expired" },
        endDate: { $lt: today },
      });

      for (const employer of expiredEmployers) {
        await Employer.findByIdAndUpdate(employer._id, {
          $set: {
            plan: "free",
            status: "expired",
            allowedResume: 0,
            viewedResume: 0,
          },
        });
      }

      console.log(
        `[Cron] ${
          expiredEmployers.length
        } plans expired on ${today.toDateString()}`
      );
    } catch (error) {
      console.error("[Cron] Error during plan expiration:", error);
    }
  });
};

export const sendNewsLetter = async (req, res) => {
  try {
    const { receivers, subject, message } = req.body;

    if (!receivers || receivers.length === 0 || !message) {
      return res.status(400).json({ success: false, message: "Invalid input" });
    }

    await sendEmail({
      to: receivers,
      subject: subject || "Newsletter",
      html: message,
    });

    console.log("Newsletter sent to:", receivers);
    res.json({
      success: true,
      message: `Newsletter sent to ${receivers.length} recipients.`,
    });
  } catch (error) {
    console.error("Error sending newsletter:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

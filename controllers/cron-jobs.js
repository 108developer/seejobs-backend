import Employer from "../models/employer/employerModel.js";
import JobListing from "../models/jobs/jobsModel.js";

export const runPlanExpiry = async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const expiredEmployers = await Employer.find({
      "subscription.status": { $ne: "Expired" },
      "subscription.endDate": { $lt: now },
    });

    for (const employer of expiredEmployers) {
      await Employer.findByIdAndUpdate(employer._id, {
        $set: {
          "subscription.plan": "Free",
          "subscription.status": "Expired",
          "subscription.allowedResume": 0,
          "subscription.viewedResume": 0,
        },
      });
    }

    console.log(
      `[Manual Cron] ${
        expiredEmployers.length
      } plans expired on ${today.toDateString()}`
    );

    res.status(200).json({
      success: true,
      expiredCount: expiredEmployers.length,
      message: "Plan expiration job completed.",
    });
  } catch (error) {
    console.error("[Manual Cron] Error during plan expiration:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

export const runJobExpiry = async (req, res) => {
  try {
    const now = new Date();

    const result = await JobListing.updateMany(
      {
        deadline: { $lt: now },
        status: "open",
      },
      { $set: { status: "closed" } }
    );

    console.log(
      `[Cron] ${result.modifiedCount} jobs expired as of ${now.toDateString()}`
    );

    res.status(200).json({
      success: true,
      expiredCount: result.modifiedCount,
      message: "Job expiration cron job completed.",
    });
  } catch (error) {
    console.error("[Cron] Job expiration error:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

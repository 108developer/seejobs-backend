// utils/handleResumeView.js

import Candidate from "../models/candidate/candidateModel.js";
import Employer from "../models/employer/employerModel.js";

export const handleResumeView = async (recruiterId, candidateId) => {
  const candidate = await Candidate.findById(candidateId);
  const employer = await Employer.findById(recruiterId);

  if (!candidate || !employer) {
    return { success: false, message: "Candidate or employer not found." };
  }

  const alreadyViewed = candidate.viewedBy.some(
    (entry) => entry.recruiter.toString() === recruiterId
  );

  if (alreadyViewed) {
    return { success: true, message: "Candidate already viewed." };
  }

  const subscription = employer.subscription;

  if (!subscription || subscription.status !== "Active") {
    return {
      success: false,
      message: `Your plan is ${
        subscription?.status || "Unavailable"
      }. Please activate your plan.`,
    };
  }

  if (subscription.allowedResume <= 0) {
    return {
      success: false,
      message: "You have reached the maximum allowed candidate views.",
    };
  }

  // Decrease allowed resumes
  subscription.allowedResume -= 1;

  if (subscription.allowedResume === 0) {
    subscription.status = "Expired";
    subscription.plan = "Free";
  }

  candidate.viewedBy.push({ recruiter: recruiterId });

  await employer.save();
  await candidate.save();

  return { success: true, message: "Resume viewed and counted." };
};

// services/tokenService.js
import { google } from "googleapis";
import Employer from "../models/employer/employerModel.js";

export const getTokensFromDB = async (recruiterEmail) => {
  const recruiter = await Employer.findOne({ email: recruiterEmail });

  if (!recruiter || !recruiter.refreshToken) {
    return null;
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({ refresh_token: recruiter.refreshToken });

  try {
    // 📌 Issue: This method is deprecated.
    // const { credentials } = await oauth2Client.refreshAccessToken();
    // recruiter.accessToken = credentials.access_token;

    // Use this
    await oauth2Client.getAccessToken();
    const { access_token, token_type, scope } = oauth2Client.credentials;

    recruiter.accessToken = access_token;

    await recruiter.save();

    return {
      access_token,
      refresh_token: recruiter.refreshToken,
      // token_type: "Bearer",
      token_type,
      scope,
      // scope: "https://www.googleapis.com/auth/gmail.send",
    };
  } catch (error) {
    console.error("Error refreshing access token:", error);
    return null;
  }
};

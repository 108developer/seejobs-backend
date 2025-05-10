// oauth.js
import dotenv from "dotenv";
import { google } from "googleapis";
dotenv.config();

const SCOPES = ["https://www.googleapis.com/auth/gmail.send"];

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export const getAuthUrl = () => {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
  });
};

export const getTokens = async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    return tokens;
  } catch (err) {
    console.error("Error while exchanging code for tokens:", err);
    throw err;
  }
};

export const setCredentials = (tokens) => {
  oauth2Client.setCredentials(tokens);
  return oauth2Client;
};

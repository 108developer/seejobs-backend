// sendMail.js
import { google } from "googleapis";
// import { getTokensFromDB } from "./services/tokenService.js";

export const sendEmail = async (
  recruiterEmail,
  recipients,
  subject,
  body,
  tokens
) => {
  if (!Array.isArray(recipients)) {
    recipients = [recipients];
  }

  // Get tokens for the recruiter
  // const tokens = await getTokensFromDB(recruiterEmail);
  // if (!tokens) throw new Error("Unable to retrieve tokens");

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials(tokens);

  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  const results = [];

  for (const recipient of recipients) {
    const to = recipient.email;
    const rawMessage = Buffer.from(
      `To: ${to}\r\n` +
        `Subject: ${subject}\r\n` +
        `Content-Type: text/html; charset=UTF-8\r\n\r\n` +
        body
    )
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    try {
      const response = await gmail.users.messages.send({
        userId: "me",
        requestBody: {
          raw: rawMessage,
        },
      });
      results.push({ email: to, success: true, id: response.data.id });
    } catch (err) {
      results.push({ email: to, success: false, error: err.message });
    }
  }

  return results;
};

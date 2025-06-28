// aws-email-service.js
// npm install aws-sdk

import AWS from "aws-sdk";
import dotenv from "dotenv";

dotenv.config();

const ses = new AWS.SES({
  region: process.env.AWS_SES_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  apiVersion: "2010-12-01",
});

export const sendEmail = async ({ to, cc, bcc, subject, text, html, from }) => {
  if (!to || !subject || (!text && !html)) {
    throw new Error("Missing required email fields: to, subject, or body");
  }

  const params = {
    Source: from || process.env.AWS_SES_FROM_ADDRESS,
    Destination: {
      ToAddresses: Array.isArray(to) ? to : [to],
      CcAddresses: cc ? (Array.isArray(cc) ? cc : [cc]) : [],
      BccAddresses: bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : [],
    },
    Message: {
      Subject: {
        Data: subject,
        Charset: "UTF-8",
      },
      Body: {},
    },
  };

  if (text) {
    params.Message.Body.Text = {
      Data: text,
      Charset: "UTF-8",
    };
  }

  if (html) {
    params.Message.Body.Html = {
      Data: html,
      Charset: "UTF-8",
    };
  }

  try {
    const result = await ses.sendEmail(params).promise();
    return result;
  } catch (err) {
    console.error("AWS SES sendEmail failed:", err);
    throw new Error(`Email send failed: ${err.message}`);
  }
};

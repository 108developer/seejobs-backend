// services/otpService.js

import Otp from "../models/otp.js";

// Generate OTP (6 digits)
export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Store OTP in MongoDB
export async function storeOTP(identifier, otp) {
  const existingOtp = await Otp.findOne({ identifier });

  if (existingOtp) {
    existingOtp.otp = otp;
    existingOtp.expiresAt = Date.now() + 3 * 60 * 1000;
    await existingOtp.save();
  } else {
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + 180);

    const otpRecord = new Otp({
      identifier,
      otp,
      expiresAt,
    });

    await otpRecord.save();
  }
}

// Get Stored OTP from MongoDB
export async function getStoredOTP(identifier) {
  const otpRecord = await Otp.findOne({ identifier });
  if (!otpRecord) {
    return null;
  }

  // Check if OTP is expired
  if (otpRecord.expiresAt < new Date()) {
    await deleteOTP(identifier);
    return null;
  }

  return otpRecord.otp;
}

// Delete OTP from MongoDB
export async function deleteOTP(identifier) {
  await Otp.deleteOne({ identifier });
}

// import redisClient from "../redis/client.js";

// export function generateOTP() {
//   return Math.floor(100000 + Math.random() * 900000).toString();
// }

// export async function storeOTP(identifier, otp) {
//   await redisClient.setEx(`otp:${identifier}`, 300, otp); // 5 mins
// }

// export async function getStoredOTP(identifier) {
//   return await redisClient.get(`otp:${identifier}`);
// }

// export async function deleteOTP(identifier) {
//   await redisClient.del(`otp:${identifier}`);
// }

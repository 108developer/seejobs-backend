// utils/googleUtils.js
import axios from "axios";

export const getUserInfo = async (access_token) => {
  try {
    const response = await axios.get(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching user info:", error);

    if (error.response && error.response.status === 401) {
      throw new Error("Unauthorized: Invalid or expired access token.");
    }

    throw new Error("An error occurred while fetching user info.");
  }
};

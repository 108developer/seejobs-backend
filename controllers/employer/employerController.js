// import Employer from "../../models/employer/employerModel.js";
// import jwt from "jsonwebtoken";

// // Controller function to create a new employer
// export const createEmployer = async (req, res) => {
//   try {
//     req.body.role = "employer";

//     const employer = await Employer.create(req.body);

//     res.status(201).json({ success: true, data: employer });
    
//   } catch (err) {
//     res.status(400).json({ success: false, message: err.message });
//   }
// };

// export const loginEmployer = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     // Find the employer with the provided email
//     const existingUser = await Employer.findOne({ email, role: "employer" });

//     if (!existingUser) {
//       // If user not found, send a response with status code 404
//       return res.status(404).send({ message: "User not found" });
//     }

//     // Compare provided password with stored hashed password
//     const isPasswordValid = password === existingUser.password;

//     if (!isPasswordValid) {
//       // If password is incorrect, send a response with status code 400
//       return res
//         .status(400)
//         .send({ success: false, message: "Incorrect password" });
//     }

//     // Generate JWT token
//     try {
//       const token = jwt.sign({ userId: existingUser._id }, "IMADEMO", {
//         expiresIn: "1h",
//       });
//       res.status(200).json({
//         success: true,
//         token,
//         message: "login successfull",
//         name: existingUser.firstName,
//       });
//     } catch (tokenError) {
//       res
//         .status(500)
//         .json({ success: false, message: "Error generating token" });
//     }
//   } catch (error) {
//     // Handle errors
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

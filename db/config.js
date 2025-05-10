import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://108developer:8mNcuG9SQoM3d4oi@cluster0.xdm1d.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
      // "mongodb+srv://rishu:rishu@cluster0.sovnymf.mongodb.net/"
    );
    console.log("MongoDB connected");
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

export default connectDB;

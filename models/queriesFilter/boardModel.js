import mongoose from "mongoose";

const boardSchema = new mongoose.Schema({
  value: {
    type: String,
    required: true,
    unique: true,
  },
  label: {
    type: String,
    required: true,
  },
});

const Board = mongoose.model("Board", boardSchema);
export default Board;

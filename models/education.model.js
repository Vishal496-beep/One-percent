import mongoose, { Schema } from "mongoose";

const educationSchema = new Schema({
  level: {
    type: String,
    enum: ["10th", "12th", "Diploma", "Undergraduate", "Postgraduate", "Other"],
    required: true,
  },
  institution: {
    type: String, // School name or College name
    required: true,
  },
  board: {
    type: String, //  "CBSE", "ICSE", "State Board" (mainly for 10th & 12th)
    default: "",
  },
  stream: {
    type: String, //  "Science (PCM)", "Commerce", "Arts" (for 12th), or "B.Tech CSE" (for UG)
    default: "",
  },
  startYear: {
    type: String, // Optional for 10th/12th
    default: "",
  },
  endYear: {
    type: String, // Year of passing, e.g., "2020"
    required: true,
  },
  grade: {
    type: String, // e.g., "92%", "9.5 CGPA"
    default: "",
  },
});



export const Education = mongoose.model("Education", educationSchema);
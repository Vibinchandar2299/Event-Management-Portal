import mongoose from "mongoose";

const TotalCountSchema = new mongoose.Schema({
  totalCounts: {
    type: Map,
    of: Number,
    default: {
      "Computer and Communication Engineering": 0,
      "Computer Science Engineering": 0,
      "Artificial Intelligence and Data Science": 0,
      "Electronics and Communication Engineering": 0,
      "Information Technology": 0,
      "Mechanical Engineering": 0,
      "Artificial Intelligence and Machine Learning": 0,
      "Computer Science and Business Systems": 0,
      "Electrical and Electronics Engineering": 0,
      "Cybersecurity": 0,
      "otherspecification":0
    },
  },
});

const TotalCount = mongoose.model("TotalCount", TotalCountSchema);

export default TotalCount;

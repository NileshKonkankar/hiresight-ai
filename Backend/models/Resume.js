const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema({

 recruiter: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User"
 },

 fileName: String,

 filePath: String,

 extractedText: String,

 aiScore: Number,
 aiData: Object,
 jobDescription: String,

 createdAt: {
  type: Date,
  default: Date.now
 },
 status: {
  type: String,
  default: "pending"
}

});

module.exports = mongoose.model("Resume", resumeSchema);
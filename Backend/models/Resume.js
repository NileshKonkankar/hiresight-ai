const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema({

 recruiter: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  required: true,
  index: true
 },

 job: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Job",
  required: true,
  index: true
 },

 fileName: String,

 filePath: String,

 extractedText: String,

 aiScore: Number,
 aiData: Object,
 aiMeta: Object,
 analysisHash: String,
 jobDescription: String,

 createdAt: {
  type: Date,
  default: Date.now
 },
 status: {
  type: String,
  enum: ["pending", "shortlisted", "rejected"],
  default: "pending"
 }

});

module.exports = mongoose.model("Resume", resumeSchema);

const mongoose = require("mongoose");

const jobDescriptionSchema = new mongoose.Schema({
  recruiter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 160
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 20000
  }
}, { timestamps: true });

module.exports = mongoose.model("JobDescription", jobDescriptionSchema);

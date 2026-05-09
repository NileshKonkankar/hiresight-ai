const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
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
  },
  status: {
    type: String,
    enum: ["open", "paused", "closed"],
    default: "open",
    index: true
  }
}, { timestamps: true });

module.exports = mongoose.model("Job", jobSchema);

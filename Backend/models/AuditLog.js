const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
  recruiter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    index: true
  },
  targetType: {
    type: String,
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId
  },
  metadata: {
    type: Object,
    default: {}
  }
}, { timestamps: true });

module.exports = mongoose.model("AuditLog", auditLogSchema);

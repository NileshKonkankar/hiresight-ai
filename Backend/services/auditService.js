const AuditLog = require("../models/AuditLog");

async function logAudit({ recruiter, action, targetType, targetId, metadata = {} }) {
  try {
    await AuditLog.create({ recruiter, action, targetType, targetId, metadata });
  } catch (error) {
    console.error("AUDIT LOG ERROR:", error);
  }
}

module.exports = logAudit;

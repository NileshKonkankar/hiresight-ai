const Resume = require("../models/Resume");
const { Parser } = require("json2csv");
const logAudit = require("../services/auditService");

exports.exportCSV = async (req, res) => {
  try {
    const query = { recruiter: req.user };

    if (req.query.jobId) {
      query.job = req.query.jobId;
    }

    const resumes = await Resume.find(query).populate("job", "title").sort({ aiScore: -1 });

    const data = resumes.map(r => ({
      jobTitle: r.job?.title || "",
      fileName: r.fileName,
      score: r.aiScore ?? "",
      confidence: r.aiData?.confidence ?? "",
      status: r.status,
      summary: r.aiData?.summary || "",
      missingRequirements: Array.isArray(r.aiData?.missingRequirements)
        ? r.aiData.missingRequirements.join("; ")
        : ""
    }));

    const parser = new Parser();
    const csv = parser.parse(data);

    await logAudit({
      recruiter: req.user,
      action: "resumes.exported",
      targetType: req.query.jobId ? "Job" : "Recruiter",
      targetId: req.query.jobId,
      metadata: { count: resumes.length }
    });

    res.header("Content-Type", "text/csv");
    res.attachment("candidates.csv");

    return res.send(csv);
  } catch (error) {
    res.status(500).json({ message: "Failed to export candidates" });
  }
};

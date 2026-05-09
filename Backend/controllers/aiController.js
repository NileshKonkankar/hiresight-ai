const crypto = require("crypto");
const Job = require("../models/Job");
const Resume = require("../models/Resume");
const { analyzeResume, modelName, PROMPT_VERSION } = require("../services/aiService");
const logAudit = require("../services/auditService");

const hashInput = (...parts) => crypto
  .createHash("sha256")
  .update(parts.join("\n---\n"))
  .digest("hex");

exports.rankCandidates = async (req, res) => {
  try {
    const { jobId } = req.body;

    if (!jobId) {
      return res.status(400).json({ message: "A job must be selected before ranking candidates" });
    }

    const job = await Job.findOne({ _id: jobId, recruiter: req.user });

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    const resumes = await Resume.find({ recruiter: req.user, job: job._id });

    if (resumes.length === 0) {
      return res.status(400).json({ message: "Upload resumes for this job before ranking" });
    }

    const results = [];

    for (const resume of resumes) {
      const analysisHash = hashInput(
        resume.extractedText,
        job.description,
        modelName,
        PROMPT_VERSION
      );

      if (resume.analysisHash !== analysisHash) {
        const aiResult = await analyzeResume(resume.extractedText, job.description);

        resume.aiScore = aiResult.overallScore;
        resume.aiData = aiResult;
        resume.aiMeta = {
          model: modelName,
          promptVersion: PROMPT_VERSION,
          analyzedAt: new Date()
        };
        resume.analysisHash = analysisHash;
        resume.jobDescription = job.description;

        await resume.save();
      }

      results.push(resume);
    }

    results.sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));

    await logAudit({
      recruiter: req.user,
      action: "job.ranked",
      targetType: "Job",
      targetId: job._id,
      metadata: {
        count: results.length,
        model: modelName,
        promptVersion: PROMPT_VERSION
      }
    });

    res.json(results);
  } catch (error) {
    if (error.code === "AI_CONFIG_MISSING") {
      return res.status(500).json({ message: "AI provider is not configured on the server" });
    }

    res.status(500).json({
      message: "Candidate ranking failed",
      error: error.message
    });
  }
};

const Job = require("../models/Job");
const Resume = require("../models/Resume");
const extractText = require("../services/pdfService");
const logAudit = require("../services/auditService");

const allowedStatuses = ["pending", "shortlisted", "rejected"];

exports.listResumes = async (req, res) => {
  try {
    const query = { recruiter: req.user };

    if (req.query.jobId) {
      query.job = req.query.jobId;
    }

    const resumes = await Resume.find(query).sort({ aiScore: -1, createdAt: -1 });
    res.json(resumes);
  } catch (error) {
    res.status(500).json({ message: "Failed to load resumes" });
  }
};

exports.uploadResumes = async (req, res) => {
  try {
    const recruiterId = req.user;
    const { jobId } = req.body;
    const files = req.files || [];

    if (!jobId) {
      return res.status(400).json({ message: "A job must be selected before uploading resumes" });
    }

    const job = await Job.findOne({ _id: jobId, recruiter: recruiterId });

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (files.length === 0) {
      return res.status(400).json({ message: "At least one PDF resume is required" });
    }

    const savedResumes = [];

    for (const file of files) {
      const text = await extractText(file.buffer);

      const resume = await Resume.create({
        recruiter: recruiterId,
        job: job._id,
        fileName: file.originalname,
        filePath: "",
        extractedText: text
      });

      savedResumes.push(resume);
    }

    await logAudit({
      recruiter: recruiterId,
      action: "resumes.uploaded",
      targetType: "Job",
      targetId: job._id,
      metadata: { count: savedResumes.length }
    });

    res.json({
      message: "Resumes uploaded successfully",
      resumes: savedResumes
    });
  } catch (error) {
    res.status(500).json({ message: "Resume upload failed", error: error.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id, status } = req.body;

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid candidate status" });
    }

    const resume = await Resume.findOneAndUpdate(
      { _id: id, recruiter: req.user },
      { status },
      { new: true }
    );

    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    await logAudit({
      recruiter: req.user,
      action: "resume.status.updated",
      targetType: "Resume",
      targetId: resume._id,
      metadata: { status }
    });

    res.json(resume);
  } catch (error) {
    res.status(500).json({ message: "Failed to update status" });
  }
};

exports.deleteResume = async (req, res) => {
  try {
    const resume = await Resume.findOneAndDelete({ _id: req.params.id, recruiter: req.user });

    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    await logAudit({
      recruiter: req.user,
      action: "resume.deleted",
      targetType: "Resume",
      targetId: resume._id
    });

    res.json({ message: "Resume deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete resume" });
  }
};

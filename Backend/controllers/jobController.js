const Job = require("../models/Job");
const JobDescription = require("../models/JobDescription");
const Resume = require("../models/Resume");
const logAudit = require("../services/auditService");

const isPresentString = (value) => typeof value === "string" && value.trim().length > 0;

exports.listJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ recruiter: req.user }).populate("jobDescription").sort({ updatedAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: "Failed to load jobs" });
  }
};

exports.createJob = async (req, res) => {
  try {
    const { title, description, jobDescriptionId } = req.body;

    let finalTitle = title;
    let finalDescription = description;
    let finalJdId = jobDescriptionId;

    if (jobDescriptionId) {
      const jd = await JobDescription.findOne({ _id: jobDescriptionId, recruiter: req.user });
      if (!jd) {
        return res.status(404).json({ message: "Job description template not found" });
      }
      finalDescription = jd.description;
      if (!finalTitle || !finalTitle.trim()) {
        finalTitle = jd.title;
      }
    } else {
      if (!isPresentString(title) || !isPresentString(description)) {
        return res.status(400).json({ message: "Job title and description are required" });
      }
      const jd = await JobDescription.create({
        recruiter: req.user,
        title: title.trim(),
        description: description.trim()
      });
      finalJdId = jd._id;
      finalTitle = title.trim();
      finalDescription = description.trim();
    }

    const job = await Job.create({
      recruiter: req.user,
      jobDescription: finalJdId,
      title: finalTitle.trim(),
      description: finalDescription.trim()
    });

    await logAudit({
      recruiter: req.user,
      action: "job.created",
      targetType: "Job",
      targetId: job._id
    });

    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ message: "Failed to create job" });
  }
};

exports.updateJob = async (req, res) => {
  try {
    const allowedStatuses = ["open", "paused", "closed"];
    const update = {};

    if (isPresentString(req.body.title)) update.title = req.body.title.trim();
    if (isPresentString(req.body.description)) update.description = req.body.description.trim();
    if (req.body.status && allowedStatuses.includes(req.body.status)) update.status = req.body.status;

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ message: "No valid job updates provided" });
    }

    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, recruiter: req.user },
      update,
      { returnDocument: 'after' }
    );

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    await logAudit({
      recruiter: req.user,
      action: "job.updated",
      targetType: "Job",
      targetId: job._id,
      metadata: { fields: Object.keys(update) }
    });

    res.json(job);
  } catch (error) {
    res.status(500).json({ message: "Failed to update job" });
  }
};

exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findOneAndDelete({ _id: req.params.id, recruiter: req.user });

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    await Resume.deleteMany({ recruiter: req.user, job: job._id });

    await logAudit({
      recruiter: req.user,
      action: "job.deleted",
      targetType: "Job",
      targetId: job._id
    });

    res.json({ message: "Job and related resumes deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete job" });
  }
};

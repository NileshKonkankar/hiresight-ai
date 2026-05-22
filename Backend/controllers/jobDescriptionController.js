const JobDescription = require("../models/JobDescription");
const Job = require("../models/Job");
const Resume = require("../models/Resume");
const logAudit = require("../services/auditService");

const isPresentString = (value) => typeof value === "string" && value.trim().length > 0;

exports.listJobDescriptions = async (req, res) => {
  try {
    const jds = await JobDescription.find({ recruiter: req.user }).sort({ updatedAt: -1 });
    res.json(jds);
  } catch (error) {
    res.status(500).json({ message: "Failed to load job descriptions" });
  }
};

exports.createJobDescription = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!isPresentString(title) || !isPresentString(description)) {
      return res.status(400).json({ message: "Title and description are required" });
    }

    const jd = await JobDescription.create({
      recruiter: req.user,
      title: title.trim(),
      description: description.trim()
    });

    await logAudit({
      recruiter: req.user,
      action: "job_description.created",
      targetType: "JobDescription",
      targetId: jd._id
    });

    res.status(201).json(jd);
  } catch (error) {
    res.status(500).json({ message: "Failed to create job description" });
  }
};

exports.updateJobDescription = async (req, res) => {
  try {
    const update = {};

    if (isPresentString(req.body.title)) update.title = req.body.title.trim();
    if (isPresentString(req.body.description)) update.description = req.body.description.trim();

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ message: "No valid job description updates provided" });
    }

    const jd = await JobDescription.findOneAndUpdate(
      { _id: req.params.id, recruiter: req.user },
      update,
      { returnDocument: 'after' }
    );

    if (!jd) {
      return res.status(404).json({ message: "Job description not found" });
    }

    // Sync the title and description to all associated Jobs (Requisitions) under this JD
    await Job.updateMany(
      { jobDescription: jd._id, recruiter: req.user },
      { title: jd.title, description: jd.description }
    );

    await logAudit({
      recruiter: req.user,
      action: "job_description.updated",
      targetType: "JobDescription",
      targetId: jd._id,
      metadata: { fields: Object.keys(update) }
    });

    res.json(jd);
  } catch (error) {
    res.status(500).json({ message: "Failed to update job description" });
  }
};

exports.deleteJobDescription = async (req, res) => {
  try {
    const jd = await JobDescription.findOneAndDelete({ _id: req.params.id, recruiter: req.user });

    if (!jd) {
      return res.status(404).json({ message: "Job description not found" });
    }

    // Find all associated jobs (requisitions)
    const associatedJobs = await Job.find({ jobDescription: jd._id, recruiter: req.user });
    const jobIds = associatedJobs.map(job => job._id);

    // Delete associated resumes and jobs
    if (jobIds.length > 0) {
      await Resume.deleteMany({ recruiter: req.user, job: { $in: jobIds } });
      await Job.deleteMany({ jobDescription: jd._id, recruiter: req.user });
    }

    await logAudit({
      recruiter: req.user,
      action: "job_description.deleted",
      targetType: "JobDescription",
      targetId: jd._id
    });

    res.json({ message: "Job description and related requisitions and resumes deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete job description" });
  }
};

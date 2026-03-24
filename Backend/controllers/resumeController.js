const Resume = require("../models/Resume");
const extractText = require("../services/pdfService");

exports.uploadResumes = async (req, res) => {

    try {

        const recruiterId = req.user;

        const files = req.files;

        let savedResumes = [];

        for (const file of files) {

            const text = await extractText(file.buffer);

            const resume = await Resume.create({

                recruiter: recruiterId,
                fileName: file.originalname,
                filePath: "",
                extractedText: text

            });

            savedResumes.push(resume);

        }

        res.json({
            message: "Resumes uploaded successfully",
            resumes: savedResumes
        });

    } catch (error) {

        res.status(500).json({
            error: error.message
        });

    }

};
exports.updateStatus = async (req, res) => {

    try {

        const { id, status } = req.body;

        const resume = await Resume.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        res.json(resume);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }

};
const Resume = require("../models/Resume");
const { Parser } = require("json2csv");

exports.exportCSV = async (req, res) => {
  try {

    const resumes = await Resume.find();

    const data = resumes.map(r => ({
      fileName: r.fileName,
      score: r.aiScore,
      status: r.status,
      summary: r.aiData?.summary
    }));

    const parser = new Parser();
    const csv = parser.parse(data);

    res.header("Content-Type", "text/csv");
    res.attachment("candidates.csv");

    return res.send(csv);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
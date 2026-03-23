const Resume = require("../models/Resume");
const analyzeResume = require("../services/aiService");

exports.rankCandidates = async (req,res) => {

 try{

  const { jobDescription } = req.body;

  const resumes = await Resume.find();

  let results = [];

  for(const resume of resumes){

   const aiResult = await analyzeResume(
    resume.extractedText,
    jobDescription
   );

   resume.aiScore = aiResult.overallScore;
   resume.aiData = aiResult;
   resume.jobDescription = jobDescription;

   await resume.save();

   results.push(resume);

  }

  results.sort((a,b)=>b.aiScore - a.aiScore);

  res.json(results);

 }catch(error){

  res.status(500).json({
   error:error.message
  });

 }

};
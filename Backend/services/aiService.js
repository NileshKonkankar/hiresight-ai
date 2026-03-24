require("dotenv").config();

const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function analyzeResume(resumeText, jobDescription) {

  const prompt = `
You are an AI recruiter.

Evaluate the candidate based on the job description.

Return ONLY valid JSON in this format:

{
  "skillMatch": number (0-100),
  "experienceMatch": number (0-100),
  "educationMatch": number (0-100),
  "overallScore": number (0-100),
  "strengths": [string],
  "weaknesses": [string],
  "summary": string (2 lines max)
}

Evaluation rules:
- Skill match = tech stack relevance
- Experience = years + relevance
- Education = degree relevance
- Overall score must be realistic

JOB DESCRIPTION:
${jobDescription}

RESUME:
${resumeText}
`;

  const response = await client.chat.completions.create({
    model: "gpt-3.5-turbo"
    messages: [
      { role: "user", content: prompt }
    ],
    temperature: 0.3
  });

  const text = response.choices[0].message.content;

  return JSON.parse(text);
}

module.exports = analyzeResume;
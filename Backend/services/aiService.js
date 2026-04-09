require("dotenv").config();
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: "https://api.x.ai/v1",
});

const modelName = process.env.XAI_MODEL || "grok-beta";

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
  "selectionRationale": "string (1-2 sentences explaining exactly WHY they are a fit/unfit based on the JD vs Resume overlap)",
  "matchHighlights": [
    {
      "requirement": "string (A core requirement specifically from the JD)",
      "candidateHighlight": "string (The specific snippet or evidence from the resume that proves this)"
    }
  ],
  "summary": "string (2 lines max overall summary)"
}

Evaluation rules:
- Skill match = tech stack relevance
- Experience = years + relevance
- Education = degree relevance
- Overall score must be realistic
- For matchHighlights, provide exactly the top 3 most important matching requirements. This is crucial to explain the rationale visually.

JOB DESCRIPTION:
${jobDescription}

RESUME:
${resumeText}
`;

  const response = await openai.chat.completions.create({
    model: modelName,
    messages: [
      { role: "system", content: "You are a helpful assistant that returns only valid JSON." },
      { role: "user", content: prompt },
    ],
    temperature: 0.3,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0].message.content;

  return JSON.parse(content);
}

module.exports = analyzeResume;

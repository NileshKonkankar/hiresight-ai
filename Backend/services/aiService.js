require("dotenv").config();

const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    generationConfig: { temperature: 0.3 }
  });

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  // Strip markdown code fences if Gemini wraps the JSON
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  return JSON.parse(cleaned);
}

module.exports = analyzeResume;

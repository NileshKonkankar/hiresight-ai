const OpenAI = require("openai");

const modelName = process.env.OPENAI_MODEL || "gpt-5";
const PROMPT_VERSION = "resume-rubric-v2";
let openaiClient;

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    const error = new Error("OPENAI_API_KEY is not configured");
    error.code = "AI_CONFIG_MISSING";
    throw error;
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  return openaiClient;
}

const clampScore = (value) => {
  const number = Number(value);
  if (Number.isNaN(number)) return 0;
  return Math.max(0, Math.min(100, Math.round(number)));
};

const asArray = (value) => Array.isArray(value) ? value : [];

function normalizeAiResult(result) {
  return {
    skillMatch: clampScore(result.skillMatch),
    experienceMatch: clampScore(result.experienceMatch),
    educationMatch: clampScore(result.educationMatch),
    overallScore: clampScore(result.overallScore),
    confidence: clampScore(result.confidence),
    selectionRationale: String(result.selectionRationale || "").slice(0, 1000),
    matchHighlights: asArray(result.matchHighlights).slice(0, 3).map(item => ({
      requirement: String(item.requirement || "").slice(0, 300),
      candidateHighlight: String(item.candidateHighlight || "").slice(0, 500)
    })),
    missingRequirements: asArray(result.missingRequirements).slice(0, 5).map(item => String(item).slice(0, 300)),
    riskFlags: asArray(result.riskFlags).slice(0, 5).map(item => String(item).slice(0, 300)),
    summary: String(result.summary || "").slice(0, 800)
  };
}

async function analyzeResume(resumeText, jobDescription) {
  const prompt = `
You are an AI hiring assistant that supports, but never replaces, human recruiter judgment.

Evaluate the resume against the job description using only job-relevant evidence. Ignore protected or sensitive attributes such as age, gender, race, ethnicity, religion, marital status, disability, nationality, photos, addresses, and other demographic signals. If the resume lacks evidence for a requirement, mark it missing instead of guessing.

Return ONLY valid JSON in this format:

{
  "skillMatch": number (0-100),
  "experienceMatch": number (0-100),
  "educationMatch": number (0-100),
  "overallScore": number (0-100),
  "confidence": number (0-100, based on how much direct evidence exists),
  "selectionRationale": "string (1-2 sentences grounded in JD-vs-resume evidence)",
  "matchHighlights": [
    {
      "requirement": "string (A core requirement specifically from the JD)",
      "candidateHighlight": "string (Specific resume evidence proving or supporting this)"
    }
  ],
  "missingRequirements": ["string (important JD requirement with little or no evidence)"],
  "riskFlags": ["string (job-relevant concerns only, such as unclear years of experience or missing certification)"],
  "summary": "string (2 lines max)"
}

Evaluation rules:
- Use a strict rubric. Must-have requirements should matter more than nice-to-have requirements.
- Provide exactly the top 3 matchHighlights when evidence exists.
- Do not infer protected attributes or use them to score.
- If confidence is below 60, say what evidence is missing.
- Scores must be realistic and calibrated; do not over-score generic keyword overlap.

JOB DESCRIPTION:
${jobDescription}

RESUME:
${resumeText}
`;

  const response = await getOpenAIClient().chat.completions.create({
    model: modelName,
    messages: [
      { role: "system", content: "You return only valid JSON for a hiring decision-support rubric." },
      { role: "user", content: prompt },
    ],
    temperature: 0.2,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0].message.content;

  return normalizeAiResult(JSON.parse(content));
}

module.exports = {
  analyzeResume,
  modelName,
  PROMPT_VERSION
};

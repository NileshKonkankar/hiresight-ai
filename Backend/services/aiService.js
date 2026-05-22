const { GoogleGenerativeAI } = require("@google/generative-ai");

const modelName = process.env.GEMINI_MODEL || "gemini-3.5-flash";
const PROMPT_VERSION = "resume-rubric-v2";
let genAI;

function getGeminiClient() {
  if (!process.env.GEMINI_API_KEY) {
    const error = new Error("GEMINI_API_KEY is not configured");
    error.code = "AI_CONFIG_MISSING";
    throw error;
  }

  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  return genAI;
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

  const client = getGeminiClient();
  const rankingSchema = {
    type: "OBJECT",
    properties: {
      skillMatch: { type: "INTEGER", description: "Score from 0-100 based on skills matching the job description." },
      experienceMatch: { type: "INTEGER", description: "Score from 0-100 based on experience matching the job description." },
      educationMatch: { type: "INTEGER", description: "Score from 0-100 based on education matching the job description." },
      overallScore: { type: "INTEGER", description: "Overall suitability score from 0-100." },
      confidence: { type: "INTEGER", description: "Confidence score from 0-100 based on direct evidence." },
      selectionRationale: { type: "STRING", description: "1-2 sentences grounded in JD-vs-resume evidence." },
      matchHighlights: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            requirement: { type: "STRING", description: "A core requirement specifically from the JD." },
            candidateHighlight: { type: "STRING", description: "Specific resume evidence proving or supporting this." }
          },
          required: ["requirement", "candidateHighlight"]
        },
        description: "Exactly 3 match highlights where evidence exists."
      },
      missingRequirements: {
        type: "ARRAY",
        items: { type: "STRING" },
        description: "Important JD requirements with little or no evidence."
      },
      riskFlags: {
        type: "ARRAY",
        items: { type: "STRING" },
        description: "Job-relevant concerns only (e.g. unclear years of experience or missing certification)."
      },
      summary: { type: "STRING", description: "Summary, 2 lines max." }
    },
    required: [
      "skillMatch",
      "experienceMatch",
      "educationMatch",
      "overallScore",
      "confidence",
      "selectionRationale",
      "matchHighlights",
      "missingRequirements",
      "riskFlags",
      "summary"
    ]
  };

  const model = client.getGenerativeModel({
    model: modelName,
    systemInstruction: "You return only valid JSON for a hiring decision-support rubric.",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: rankingSchema,
      temperature: 0.2,
    }
  });

  const result = await model.generateContent({
    contents: [
      { role: "user", parts: [{ text: prompt }] }
    ]
  });

  const content = result.response.text();
  let cleanedContent = content.trim();
  if (cleanedContent.startsWith("```")) {
    cleanedContent = cleanedContent.replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
  }

  try {
    return normalizeAiResult(JSON.parse(cleanedContent));
  } catch (parseError) {
    console.error("Failed to parse Gemini response JSON. Raw content was:\n", content);
    throw new Error(`AI generated invalid JSON: ${parseError.message}. Raw output preview: ${content.slice(0, 300)}...`);
  }
}

module.exports = {
  analyzeResume,
  modelName,
  PROMPT_VERSION
};

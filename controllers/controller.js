const Groq = require("groq-sdk");
const similarity = require("../utils/similarity");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

exports.evaluate = async (req, res) => {
  try {
    const { topic, tutorText } = req.body;

    if (!topic || !tutorText) {
      return res.status(400).json({
        error: "Missing topic or transcript",
      });
    }

    // =========================================
    // TUTOR WORD COUNT
    // =========================================

    const tutorWordCount =
      tutorText.split(/\s+/).length;

    const estimatedLines =
      Math.max(5, Math.ceil(tutorWordCount / 10));

    // =========================================
    // GENERATE AI REFERENCE
    // =========================================

    const aiResponse =
      await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",

        messages: [
          {
            role: "user",

            content: `
Explain "${topic}" in educational format.

IMPORTANT:
- Keep explanation around ${estimatedLines} lines.
- Keep explanation close to ${tutorWordCount} words.
- Include important concepts naturally.
- Keep explanation balanced and fair.
`,
          },
        ],
      });

    const reference =
      aiResponse.choices[0].message.content;

    // =========================================
    // MATHEMATICAL BASE SCORE
    // =========================================

    const mathematicalScore =
      similarity(reference, tutorText);

    // =========================================
    // AI ANALYSIS
    // =========================================

    const analysisResponse =
      await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",

        messages: [
          {
            role: "user",

            content: `
You are an expert educational evaluator.

Evaluate how well the tutor explanation matches the AI reference.

SCORING RULES:
- Score MUST be between 0 and 100.
- NEVER return decimal values like 0.7.
- 0 = completely irrelevant
- 100 = nearly perfect explanation
- Penalize missing concepts heavily.
- Reward conceptual similarity.
- Reward completeness.
- Reward accurate topic coverage.

Mathematical similarity baseline:
${mathematicalScore}

REFERENCE:
${reference}

TUTOR:
${tutorText}

Return ONLY VALID JSON:

{
  "score": 0,
  "accuracy": "",
  "matched_concepts": [],
  "missing_concepts": [],
  "extra_points": [],
  "feedback": ""
}
`,
          },
        ],
      });

    // =========================================
    // CLEAN RESPONSE
    // =========================================

    let raw =
      analysisResponse.choices[0].message.content;

    raw = raw.replace(/```json/g, "");
    raw = raw.replace(/```/g, "");
    raw = raw.trim();

    let analysis;

    try {
      analysis = JSON.parse(raw);
    } catch (e) {
      analysis = {
        score: mathematicalScore,
        accuracy: "medium",
        matched_concepts: [],
        missing_concepts: [],
        extra_points: [],
        feedback:
          "AI response parsing failed.",
      };
    }

    // =========================================
    // FIX DECIMAL SCORE ISSUE
    // =========================================

    let aiScore = Number(analysis.score);

    // If AI gives 0.7 → convert to 70
    if (aiScore <= 1) {
      aiScore = aiScore * 100;
    }

    // Clamp
    aiScore = Math.max(
      0,
      Math.min(100, aiScore)
    );

    // =========================================
    // HYBRID FINAL SCORE
    // =========================================

    const finalScore = Math.round(
      (aiScore * 0.7) +
      (mathematicalScore * 0.3)
    );

    analysis.score = finalScore;

    // =========================================
    // RESPONSE
    // =========================================

    res.json({
      reference,
      tutorText,
      analysis,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Server Error",
    });
  }
};
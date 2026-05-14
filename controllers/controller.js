const Groq = require("groq-sdk");

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

    // ===============================
    // COUNT TUTOR TRANSCRIPT WORDS
    // ===============================

    const tutorWordCount =
      tutorText.split(/\s+/).length;

    // APPROXIMATE LINE ESTIMATION
    const estimatedLines =
      Math.max(5, Math.ceil(tutorWordCount / 10));

    // ===============================
    // GENERATE SAME-SIZED AI CONTENT
    // ===============================

    const aiResponse =
      await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",

        messages: [
          {
            role: "user",

            content: `
Explain "${topic}" in educational format.

IMPORTANT RULES:
- Keep explanation approximately ${estimatedLines} lines.
- Keep word count close to ${tutorWordCount} words.
- Cover important concepts naturally.
- Do not make response too short or too detailed.
- Match tutor explanation size fairly.
`,
          },
        ],
      });

    const reference =
      aiResponse.choices[0].message.content;

    // ===============================
    // AI ANALYSIS
    // ===============================

    const analysisResponse =
      await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",

        messages: [
          {
            role: "user",

            content: `
You are an expert educational evaluator.

Compare the Tutor explanation against the AI reference.

VERY IMPORTANT SCORING RULES:
- Give realistic score.
- Penalize missing concepts.
- Penalize irrelevant explanation.
- Reward conceptual similarity.
- Reward topic coverage.
- Do not give high score for partial answers.

Reference:
${reference}

Tutor:
${tutorText}

Return ONLY VALID JSON.

{
  "score": number,
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

    // ===============================
    // CLEAN JSON RESPONSE
    // ===============================

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
        score: 0,
        accuracy: "unknown",
        matched_concepts: [],
        missing_concepts: [],
        extra_points: [],
        feedback: raw,
      };
    }

    // ===============================
    // FINAL RESPONSE
    // ===============================

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
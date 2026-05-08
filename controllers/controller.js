const Groq = require("groq-sdk");
const similarity = require("../utils/similarity");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

exports.evaluate = async (req, res) => {
  try {
    const { topic, tutorText } = req.body;

    // STEP 1: Generate AI reference
    const aiResponse = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: `Explain ${topic} in educational format with important concepts.`,
        },
      ],
    });

    const reference =
      aiResponse.choices[0].message.content;

    // STEP 2: Similarity score
    const score = similarity(reference, tutorText);

    // STEP 3: Detailed analysis
    const analysisResponse =
      await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "user",
            content: `
You are an expert educational evaluator.

Compare the Tutor explanation against the AI reference.

IMPORTANT:
- Give REALISTIC scoring.
- Penalize missing concepts heavily.
- Do NOT give high scores for partial explanations.

Reference:
${reference}

Tutor:
${tutorText}

Return ONLY VALID JSON:

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

    let raw =
      analysisResponse.choices[0].message.content;

    // REMOVE ```json
    raw = raw.replace(/```json/g, "");
    raw = raw.replace(/```/g, "");
    raw = raw.trim();

    let analysis;

    try {
      analysis = JSON.parse(raw);
    } catch (e) {
      analysis = {
        score,
        matched_concepts: [],
        missing_concepts: [],
        extra_points: [],
        accuracy: "Unknown",
        feedback: raw,
      };
    }

    res.json({
      score,
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
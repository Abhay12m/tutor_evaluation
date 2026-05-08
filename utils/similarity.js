const natural = require("natural");

module.exports = (reference, tutor) => {
  // Normalize text
  const cleanReference = reference.toLowerCase();
  const cleanTutor = tutor.toLowerCase();

  // Tokenize
  const tokenizer = new natural.WordTokenizer();

  const refWords = tokenizer.tokenize(cleanReference);
  const tutorWords = tokenizer.tokenize(cleanTutor);

  // Remove duplicates
  const uniqueRefWords = [...new Set(refWords)];
  const uniqueTutorWords = [...new Set(tutorWords)];

  // Find matched words
  const matchedWords = uniqueRefWords.filter(word =>
    uniqueTutorWords.includes(word)
  );

  // Coverage percentage
  const coverage =
    matchedWords.length / uniqueRefWords.length;

  // Missing concepts penalty
  const missingWords =
    uniqueRefWords.length - matchedWords.length;

  const penalty =
    missingWords / uniqueRefWords.length;

  // Final score formula
  let finalScore =
    (coverage * 100) - (penalty * 40);

  // Clamp values
  finalScore = Math.max(0, Math.min(100, finalScore));

  return Math.round(finalScore);
};
// Mastra reads GOOGLE_GENERATIVE_AI_API_KEY for google/* models.
// Allow the shorter GEMINI_API_KEY alias in .env files.
if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY && process.env.GEMINI_API_KEY) {
  process.env.GOOGLE_GENERATIVE_AI_API_KEY = process.env.GEMINI_API_KEY;
}

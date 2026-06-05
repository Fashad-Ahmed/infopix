// Mastra reads GOOGLE_GENERATIVE_AI_API_KEY for google/* models.
// Accept GOOGLE_API_KEY or GEMINI_API_KEY as aliases in .env files.
if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
  const alias = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (alias) process.env.GOOGLE_GENERATIVE_AI_API_KEY = alias;
}

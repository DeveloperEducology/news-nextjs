// 1. Import the ENTIRE module
const genai = require("@google/genai");

// 2. The constructor is likely on the 'default' property OR the 'GoogleGenerativeAI' property
// We will check for both.
const Constructor = genai.GoogleGenerativeAI || genai.default;

// 3. Initialize Gemini AI
const genAI = new Constructor(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// This is the function that translates and summarizes
export async function formatTweetWithGemini(text) {
  const prompt = `You are a professional Telugu news editor. 
  Take the following English text, translate it to Telugu, and generate a title and summary.
  1.  **Title:** A short, catchy headline in Telugu.
  2.  **Summary:** A concise summary in Telugu, approximately 50-70 words.
  Return ONLY a valid JSON object with two keys: "title" and "summary".
  Do not add any other text, markdown, or backticks.
  Input Text:
  ${text}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = await response.text();
    const cleanedJsonString = responseText.trim().replace(/```json/g, "").replace(/```/g, "").trim();
    const parsedData = JSON.parse(cleanedJsonString);
    parsedData.originalText = text; 
    return parsedData;
  } catch (error) {
    console.error("Gemini helper function error:", error.message);
    return {
      title: text.substring(0, 70) + "...",
      summary: text,
      originalText: text,
    };
  }
}
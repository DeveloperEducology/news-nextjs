import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import dbConnect from "@/lib/mongodb";
import Article from "@/models/Article";

// --- 1. IMPORT GEMINI AND INITIALIZE IT HERE ---
// This is the correct way to import in a Next.js API route
const { GoogleGenerativeAI } = require("@google/genai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
// --- END ---

// --- 2. PASTE THE HELPER FUNCTIONS HERE ---
// This is the function that translates and summarizes
async function formatTweetWithGemini(text) {
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

// Slugify (with the regex fix)
const slugify = (str) => {
  if (!str) return '';
  str = str.toLowerCase().trim();
  const teluguRegex = /[\u0C00-\u0C7F]/;
  if (teluguRegex.test(str)) {
    return str.replace(/\s+/g, '-').replace(/[^\u0C00-\u0C7F\w\-]+/g, '');
  } else {
    return str.replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
  }
};
// --- END OF HELPER FUNCTIONS ---


// --- 3. YOUR MAIN API HANDLER ---
export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user.role !== "admin") {
    return res.status(403).json({ success: false, error: "Forbidden" });
  }

  const { tweet_ids } = req.body;
  if (!tweet_ids || !Array.isArray(tweet_ids) || tweet_ids.length === 0) {
    return res.status(400).json({ error: "tweet_ids must be a non-empty array." });
  }

  await dbConnect();
  
  const TWITTER_API_URL = "https://api.twitterapi.io/v2/tweets";
  const TWITTER_API_IO_KEY = process.env.TWITTER_API_KEY;

  const successfulPosts = [];
  const failedIds = [];

  for (const tweetId of tweet_ids) {
    try {
      const existingArticle = await Article.findOne({ slug: `tweet-${tweetId}` });
      if (existingArticle) {
        console.warn(`Tweet ${tweetId} already exists. Skipping.`);
        continue;
      }

      // Step 1: Fetch Tweet
      const url = `${TWITTER_API_URL}?ids=${tweetId}&tweet.fields=created_at,author_id,entities,lang&user.fields=name,username&expansions=author_id,attachments.media_keys&media.fields=media_key,url,preview_image_url`;
      const response = await fetch(url, {
        headers: { "x-api-key": TWITTER_API_IO_KEY }
      });
      if (!response.ok) throw new Error(`Twitter API error for ${tweetId}: ${await response.text()}`);
      
      const data = await response.json();
      if (!data.data || data.data.length === 0) throw new Error(`Tweet ${tweetId} not found.`);
      
      const tweet = data.data[0];
      const authorUser = data.includes?.users?.find(u => u.id === tweet.author_id) || { name: 'Unknown', username: 'user' };
      const media = data.includes?.media || [];
      const featuredImage = media.find(m => m.type === 'photo')?.url || null;

      // Step 2: Gemini (now in this file)
      const geminiResult = await formatTweetWithGemini(tweet.text);

      // Step 3: Embed
      const liveContent = `
        <p>${(geminiResult.originalText || tweet.text || '').replace(/\n/g, '<br />')}</p>
        <blockquote class="twitter-tweet" data-media-max-width="560">
          <a href="https://x.com/${authorUser.username}/status/${tweet.id}"></a>
        </blockquote>
      `;

      // Step 4: Save
      const newPost = new Article({
        title: geminiResult.title || 'Untitled Tweet',
        slug: `tweet-${tweet.id}`,
        summary: geminiResult.summary || '',
        liveContent,
        isFullArticle: false,
        status: 'published',
        author: authorUser.name,
        category: 'Twitter',
        featuredImage,
        publishedDate: new Date(tweet.created_at || Date.now()),
      });

      const savedPost = await newPost.save();
      successfulPosts.push(savedPost);

      // Step 5: Indexing
      fetch(`${process.env.NEXTAUTH_URL}/api/request-indexing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urlPath: `/live/twitter`, type: 'URL_UPDATED' })
      }).catch(err => console.error('Indexing failed:', err));

    } catch (error) {
      console.error(`Full error for ${tweetId}:`, error.stack || error.message);
      failedIds.push({ id: tweetId, reason: error.message });
    }
  }

  res.status(200).json({
    message: `Processed ${tweet_ids.length} tweets. Successfully added ${successfulPosts.length}.`,
    successfulPosts,
    failedIds,
  });
}
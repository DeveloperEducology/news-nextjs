import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import dbConnect from "@/lib/mongodb";
import Article from "@/models/Article";

export default async function handler(req, res) {
  // 1. Security Check (Only Admin)
  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user.role !== "admin") {
    return res.status(403).json({ success: false, error: "Forbidden" });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  await dbConnect();

  try {
    const articles = req.body; // This should be an ARRAY of objects

    if (!Array.isArray(articles)) {
      return res.status(400).json({ success: false, error: "Input must be an array of articles" });
    }

    // 2. Process the articles
    const articlesToInsert = articles.map(article => ({
      ...article,
      status: 'draft',          // Force status to draft
      isFullArticle: true,      // Assume these are full articles
      liveContent: '',          
      author: article.author || 'Admin', // Default author if empty
      publishedDate: new Date(),
      // Keep existing fields like title, slug, content, tags, featuredImage
    }));

    // 3. Insert into Database
    // 'ordered: false' means if one fails (e.g. duplicate slug), others will still continue
    const result = await Article.insertMany(articlesToInsert, { ordered: false });

    res.status(200).json({ 
      success: true, 
      message: `Successfully created ${result.length} drafts.`,
      data: result 
    });

  } catch (error) {
    // Partial success is possible with insertMany, but usually it throws on the first error
    // unless ordered: false is used.
    res.status(400).json({ success: false, error: error.message });
  }
}
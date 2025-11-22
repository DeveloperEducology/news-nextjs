import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import dbConnect from "@/lib/mongodb";
import Article from "@/models/Article";

export default async function handler(req, res) {
  // 1. Security: Only Admin
  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user.role !== "admin") {
    return res.status(403).json({ success: false, error: "Forbidden" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  await dbConnect();

  try {
    const items = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, error: "Invalid data format. Expected an array []." });
    }

    // 2. Build Bulk Operations
    // We use 'bulkWrite' with 'updateOne' + 'upsert: true'.
    // This ensures we don't create duplicate slugs; we update if it exists.
    const operations = items.map((item) => ({
      updateOne: {
        filter: { slug: item.slug },
        update: {
          $set: {
            title: item.title,
            summary: item.summary,
            content: item.content,
            author: item.author || "Admin",
            category: item.category || "General",
            featuredImage: item.featuredImage,
            tags: item.tags, // Array of strings
            status: "draft", // Force draft mode so you can review them
            isFullArticle: true,
            publishedDate: new Date(),
          },
        },
        upsert: true, // Create if it doesn't exist
      },
    }));

    // 3. Execute
    const result = await Article.bulkWrite(operations);

    res.status(200).json({
      success: true,
      message: `Processed ${items.length} articles.`,
      inserted: result.upsertedCount,
      updated: result.modifiedCount,
    });

  } catch (error) {
    console.error("Bulk Import Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}
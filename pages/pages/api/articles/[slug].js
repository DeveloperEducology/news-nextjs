import dbConnect from "@/lib/mongodb";
import Article from "@/models/Article";
import { getServerSession } from "next-auth/next"; // 1. IMPORT
import { authOptions } from "../auth/[...nextauth]"; // 2. IMPORT your authOptions

export default async function handler(req, res) {
  const { method } = req;
  const { slug } = req.query;

  // 3. This is the new, more reliable way to check the session
  const session = await getServerSession(req, res, authOptions);

  // Check for admin session for 'write' operations
  if (method === "PUT" || method === "DELETE") {
    if (!session || session.user.role !== "admin") {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }
  }

  await dbConnect();

  switch (method) {
    case "GET":
      try {
        const article = await Article.findOne({ slug: slug });
        if (!article) {
          return res.status(404).json({ success: false });
        }
        res.status(200).json({ success: true, data: article });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
      break;

    case "PUT":
      try {
        const article = await Article.findOneAndUpdate({ slug: slug }, req.body, {
          new: true,
          runValidators: true,
        });
        if (!article) {
          return res.status(404).json({ success: false });
        }
        res.status(200).json({ success: true, data: article });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
      break;

    case "DELETE":
      try {
        const deletedArticle = await Article.deleteOne({ slug: slug });
        if (!deletedArticle.deletedCount) {
          return res.status(4404).json({ success: false });
        }
        res.status(200).json({ success: true, data: {} });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
      break;

    default:
      res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
      res.status(405).end(`Method ${method} Not Allowed`);
      break;
  }
}
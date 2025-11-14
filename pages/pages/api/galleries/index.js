import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import dbConnect from "@/lib/mongodb";
import Gallery from "@/models/Gallery";

export default async function handler(req, res) {
  const { method } = req;
  await dbConnect();

  switch (method) {
    case 'GET':
      // Get all published galleries for the main list
      try {
        const galleries = await Gallery.find({ status: 'published' })
          .sort({ publishedDate: -1 })
          .select('title slug featuredImage summary publishedDate'); // Only fetch what we need for the list
        res.status(200).json({ success: true, data: galleries });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
      break;

    case 'POST':
      // Create a new gallery (Admin only)
      try {
        const session = await getServerSession(req, res, authOptions);
        if (!session || session.user.role !== "admin") {
          return res.status(403).json({ success: false, error: "Forbidden" });
        }
        const gallery = await Gallery.create(req.body);
        res.status(201).json({ success: true, data: gallery });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
      break;
  }
}
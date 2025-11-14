import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import dbConnect from "@/lib/mongodb";
import Photo from "@/models/Photo";

export default async function handler(req, res) {
  const { method } = req;
  await dbConnect();

  switch (method) {
    case 'GET':
      // Get all photos
      try {
        const photos = await Photo.find({}).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: photos });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
      break;

    case 'POST':
      // --- THIS IS THE UPDATE ---
      // Create a new photo OR an array of photos
      try {
        const session = await getServerSession(req, res, authOptions);
        if (!session || session.user.role !== "admin") {
          return res.status(403).json({ success: false, error: "Forbidden" });
        }
        
        // Check if req.body is an array or a single object
        const dataToInsert = req.body;
        
        // Photo.insertMany() works for both a single object or an array!
        const photos = await Photo.insertMany(dataToInsert);
        
        res.status(201).json({ success: true, data: photos });
        
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
      break;
      // --- END OF UPDATE ---

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
      break;
  }
}
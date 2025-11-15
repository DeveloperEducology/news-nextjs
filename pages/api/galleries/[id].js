import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import dbConnect from "@/lib/mongodb";
import Gallery from "@/models/Gallery"; // Make sure this path is correct

export default async function handler(req, res) {
  const { method } = req;
  const { id } = req.query; // Get the gallery ID from the URL

  const session = await getServerSession(req, res, authOptions);
  
  // All actions on a specific gallery require admin
  if (!session || session.user.role !== "admin") {
    return res.status(403).json({ success: false, error: "Forbidden" });
  }

  await dbConnect();

  switch (method) {
    // GET: Used to fetch data for the "Edit" page
    case "GET":
      try {
        const gallery = await Gallery.findById(id);
        if (!gallery) {
          return res.status(404).json({ success: false });
        }
        res.status(200).json({ success: true, data: gallery });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
      break;

    // PUT: Used to update a gallery
    case "PUT":
      try {
        const gallery = await Gallery.findByIdAndUpdate(id, req.body, {
          new: true,
          runValidators: true,
        });
        if (!gallery) {
          return res.status(404).json({ success: false });
        }
        res.status(200).json({ success: true, data: gallery });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
      break;

    // DELETE: Used to delete a gallery
    case "DELETE":
      try {
        const deletedGallery = await Gallery.deleteOne({ _id: id });
        if (!deletedGallery.deletedCount) {
          return res.status(404).json({ success: false });
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
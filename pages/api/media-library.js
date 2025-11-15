import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import dbConnect from "@/lib/mongodb";
import Gallery from "@/models/Gallery";
import Article from "@/models/Article"; // <-- 1. IMPORT THE ARTICLE MODEL

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user.role !== "admin") {
    return res.status(403).json({ success: false, error: "Forbidden" });
  }

  await dbConnect();

  try {
    const allImages = [];

    // --- 2. FETCH FROM GALLERIES ---
    const galleries = await Gallery.find({}).sort({ createdAt: -1 });
    
    galleries.forEach(gallery => {
      // Add the gallery's main cover image
      if (gallery.featuredImage) {
        allImages.push({
          imageUrl: gallery.featuredImage,
          caption: gallery.title, // Use gallery title as caption
          id: `${gallery._id}_cover`
        });
      }
      // Add all images from inside the gallery
      gallery.images.forEach((img, index) => {
        allImages.push({
          imageUrl: img.imageUrl,
          caption: img.caption || gallery.title,
          id: `${gallery._id}_${index}`
        });
      });
    });
    
    // --- 3. FETCH FROM ARTICLES ---
    // We only need the 'featuredImage' and 'title' fields
    const articles = await Article.find({ featuredImage: { $ne: null } })
      .select('featuredImage title')
      .sort({ createdAt: -1 });

    articles.forEach(article => {
      if (article.featuredImage) {
        allImages.push({
          imageUrl: article.featuredImage,
          caption: article.title,
          id: `${article._id}_article_img`
        });
      }
      // Note: We are not adding 'featuredVideo' to the *image* library
    });
    // --- END OF NEW SECTION ---

    // 4. Remove duplicates
    const uniqueImages = allImages.filter((img, index, self) =>
      // Check that the image URL is not null/empty and is unique
      img.imageUrl && index === self.findIndex((t) => (
        t.imageUrl === img.imageUrl
      ))
    );
    
    // 5. Sort by most recent (approximated by ID)
    // A more robust way would be to add the 'createdAt' date to each item
    const sortedImages = uniqueImages.sort((a, b) => 
      b.id.toString().localeCompare(a.id.toString())
    );

    res.status(200).json({ success: true, data: sortedImages });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
}
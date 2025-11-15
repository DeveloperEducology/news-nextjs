import dbConnect from '../../../lib/mongodb';
import Article from '../../../models/Article';

export default async function handler(req, res) {
  const { method } = req;

  await dbConnect(); // Connect to the database

  switch (method) {
    case 'GET':
      // Get all articles
    try {
        const page = parseInt(req.query.page) || 1; // Get page number, default to 1
        const limit = 10; // 10 articles per page
        const skip = (page - 1) * limit;
        const now = new Date();

        // The same query logic from your index page
        const query = {
          $or: [
            { status: 'published', publishedDate: { $lte: now } },
            { status: { $exists: false } }
          ]
        };

        const articles = await Article.find(query)
          .sort({ publishedDate: -1, createdAt: -1 })
          .skip(skip) // Skip articles from previous pages
          .limit(limit); // Get only 10

        // Get the total count of all articles that match the query
        const totalPosts = await Article.countDocuments(query);
        
        // Serialize the data (we need to do this here too)
        const serializedArticles = articles.map((doc) => {
          const article = doc.toObject();
          article._id = article._id.toString();
          if (article.publishedDate) {
            article.createdAt = article.publishedDate.toString();
          } else if (article.createdAt) {
            article.createdAt = article.createdAt.toString();
          }
          if (article.updatedAt) {
            article.updatedAt = article.updatedAt.toString();
          }
          delete article.publishedDate;
          return article;
        });

        res.status(200).json({ 
          success: true, 
          data: serializedArticles,
          total: totalPosts // Send total count to the frontend
        });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
      break;
    // --- END OF UPDATED GETTER ---

    case 'POST':
      // Create a new article
      try {
        // req.body contains the JSON from our form
        const article = await Article.create(req.body); 
        res.status(201).json({ success: true, data: article });
      } catch (error) {
        // Handle errors, e.g., a duplicate slug
        res.status(400).json({ success: false, error: error.message });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      // This is the fixed typo
      res.status(405).end(`Method ${method} Not Allowed`);
      break;
  }
}
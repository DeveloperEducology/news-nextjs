import dbConnect from '../../../lib/mongodb';
import Article from '../../../models/Article';

export default async function handler(req, res) {
  const { method } = req;

  await dbConnect(); // Connect to the database

  switch (method) {
    case 'GET':
      // Get all articles
      try {
        const articles = await Article.find({}).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: articles });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
      break;

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
import dbConnect from '../lib/mongodb';
import Article from '../models/Article';
import Gallery from '../models/Gallery'; // <-- 1. IMPORT YOUR GALLERY MODEL

const BASE_URL = 'https://www.telugushorts.com';

// Helper function to format date to YYYY-MM-DD
const toISODate = (date) => {
  // If the date is valid, use it.
  if (date) {
    const validDate = new Date(date);
    if (!isNaN(validDate)) {
      return validDate.toISOString().split('T')[0];
    }
  }
  // If date is null, undefined, or invalid, fallback to today.
  return new Date().toISOString().split('T')[0];
};

// 2. THE GENERATOR NOW ACCEPTS 'articles' AND 'galleries'
function generateSitemapXml(articles, galleries) {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  // 1. Add the Homepage
  xml += `
    <url>
      <loc>${BASE_URL}/</loc>
      <lastmod>${toISODate(new Date())}</lastmod>
      <priority>1.0</priority>
    </url>
  `;

  // 2. Add the main Gallery List page
  xml += `
    <url>
      <loc>${BASE_URL}/gallery</loc>
      <lastmod>${toISODate(new Date())}</lastmod>
      <priority>0.8</priority>
    </url>
  `;

  // --- THIS IS THE NEW PART ---
  // 3. Add the Live Updates page
  xml += `
    <url>
      <loc>${BASE_URL}/live</loc>
      <lastmod>${toISODate(new Date())}</lastmod>
      <changefreq>hourly</changefreq>
      <priority>0.9</priority>
    </url>
  `;
  // --- END OF NEW PART ---
  
  // 3. Add all Article pages
  articles.forEach(article => {
    // Use the most recent date
    const lastMod = toISODate(article.updatedAt || article.publishedDate || article.createdAt);
    
    xml += `
      <url>
        <loc>${BASE_URL}/article/${article.slug}</loc>
        <lastmod>${lastMod}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.7</priority>
      </url>
    `;
  });

  // 4. Add all Gallery pages
  galleries.forEach(gallery => {
    const lastMod = toISODate(gallery.updatedAt || gallery.publishedDate || gallery.createdAt);
    
    xml += `
      <url>
        <loc>${BASE_URL}/gallery/${gallery.slug}</loc>
        <lastmod>${lastMod}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.6</priority>
      </url>
    `;
  });

  xml += `</urlset>`;
  return xml;
}

// 3. UPDATE getServerSideProps TO FETCH BOTH
export async function getServerSideProps({ res }) {
  try {
    await dbConnect();
    const now = new Date();
    
    // Fetch all published articles
    const articles = await Article.find({
      $or: [
        { status: 'published', publishedDate: { $lte: now } },
        { status: { $exists: false } }
      ]
    }).select('slug updatedAt createdAt publishedDate');

    // Fetch all published galleries
    const galleries = await Gallery.find({ 
      status: 'published', 
      publishedDate: { $lte: now } 
    }).select('slug updatedAt createdAt publishedDate');
  
    // Generate the sitemap XML
    const sitemap = generateSitemapXml(articles, galleries);

    // Set the response headers
    res.setHeader('Content-Type', 'text/xml');
    
    // Send the XML as the response
    res.write(sitemap);
    res.end();

  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.statusCode = 500;
    res.end('Internal Server Error');
  }

  // Return an empty props object
  return { props: {} };
}

// This is just a dummy component
const Sitemap = () => {};
export default Sitemap;
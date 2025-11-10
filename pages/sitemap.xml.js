import dbConnect from '../lib/mongodb';
import Article from '../models/Article';

const BASE_URL = 'https://www.telugushorts.com';

// Helper function to format date to YYYY-MM-DD
// --- THIS IS THE FIX ---
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
// --- END OF FIX ---

function generateSitemapXml(articles) {
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

  // 2. Add other static pages
  xml += `
    <url>
      <loc>${BASE_URL}/create-article</loc>
      <lastmod>${toISODate(new Date())}</lastmod>
      <priority>0.5</priority>
    </url>
  `;

  // 3. Add all dynamic Article pages
  articles.forEach(article => {
    // This will now safely handle missing dates
    const lastMod = toISODate(article.updatedAt || article.createdAt);
    
    xml += `
      <url>
        <loc>${BASE_URL}/article/${article.slug}</loc>
        <lastmod>${lastMod}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.7</priority>
      </url>
    `;
  });

  xml += `</urlset>`;
  return xml;
}

export async function getServerSideProps({ res }) {
  try {
    await dbConnect();
    
    const articles = await Article.find({})
      .select('slug updatedAt createdAt')
      .sort({ createdAt: -1 });

    const sitemap = generateSitemapXml(articles);

    res.setHeader('Content-Type', 'text/xml');
    res.write(sitemap);
    res.end();

  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.statusCode = 500;
    res.end('Internal Server Error');
  }

  return { props: {} };
}

const Sitemap = () => {};
export default Sitemap;

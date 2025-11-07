import dbConnect from '../lib/mongodb';
import Article from '../models/Article';

// Set your website's base URL
const BASE_URL = 'https://news-nextjs.onrender.com';

// Helper function to format date to YYYY-MM-DD
const toISODate = (date) => new Date(date).toISOString().split('T')[0];

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

  // 2. Add other static pages (like /create-article, if you want it indexed)
  xml += `
    <url>
      <loc>${BASE_URL}/create-article</loc>
      <lastmod>${toISODate(new Date())}</lastmod>
      <priority>0.5</priority>
    </url>
  `;

  // 3. Add all dynamic Article pages
  articles.forEach(article => {
    // Use updatedAt if it exists, otherwise createdAt
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

// This is the magic. It's a server-side-only function.
export async function getServerSideProps({ res }) {
  await dbConnect();
  
  // Fetch all articles, but only the fields we need
  const articles = await Article.find({})
    .select('slug updatedAt createdAt')
    .sort({ createdAt: -1 });

  // Generate the sitemap XML
  const sitemap = generateSitemapXml(articles);

  // Set the response headers
  res.setHeader('Content-Type', 'text/xml');
  
  // Send the XML as the response
  res.write(sitemap);
  res.end();

  // Return an empty props object
  return { props: {} };
}

// This is just a dummy component so Next.js doesn't complain.
// The real work happens in getServerSideProps.
const Sitemap = () => {};
export default Sitemap;

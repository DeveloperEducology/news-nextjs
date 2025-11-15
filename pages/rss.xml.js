import dbConnect from '../lib/mongodb';
import Article from '../models/Article';

const BASE_URL = 'https://www.telugushorts.com';

// Helper function to escape special XML characters
function escapeXML(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
}

function generateRssXml(articles) {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>TeluguShorts</title>
    <link>${BASE_URL}</link>
    <description>The latest news in Telugu.</description>
    <language>te</language>
    <atom:link href="${BASE_URL}/rss.xml" rel="self" type="application/rss+xml" />
  `;

  // Add each article as an <item>
  articles.forEach(article => {
    const articleUrl = `${BASE_URL}/article/${article.slug}`;
    const pubDate = new Date(article.publishedDate || article.createdAt).toUTCString();

    // --- THIS IS THE UPDATE ---
    // Create an HTML description with the image
    let description = '';
    if (article.featuredImage) {
      // Add the image first, with some basic styling
      description += `<img 
        src="${escapeXML(article.featuredImage)}" 
        alt="${escapeXML(article.title)}" 
        style="max-width:100%; height:auto; border-radius:8px;" 
      /><br/><br/>`;
    }
    // Add the escaped summary text after the image
    description += escapeXML(article.summary);

    xml += `
    <item>
      <title>${escapeXML(article.title)}</title>
      <link>${articleUrl}</link>
      
      {/* Use CDATA to wrap the HTML description */}
      <description><![CDATA[${description}]]></description>
      
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="true">${articleUrl}</guid>
    </item>
    `;
    // --- END OF UPDATE ---
  });

  xml += `
  </channel>
</rss>
  `;
  return xml;
}

export async function getServerSideProps({ res }) {
  await dbConnect();
  
  const now = new Date();
  
  const query = {
    $or: [
      { status: 'published', publishedDate: { $lte: now } },
      { status: { $exists: false } }
    ]
  };

  // Fetch the latest 20 articles. We need the full document
  // (including featuredImage, title, summary)
  const articles = await Article.find(query)
    .sort({ publishedDate: -1, createdAt: -1 })
    .limit(20);

  // Generate the XML
  const rss = generateRssXml(articles);

  // Send the response
  res.setHeader('Content-Type', 'text/xml');
  res.write(rss);
  res.end();

  return { props: {} };
}

const Rss = () => {};
export default Rss;
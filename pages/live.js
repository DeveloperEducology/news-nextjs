import SeoHead from '@/components/SeoHead';
import dbConnect from '@/lib/mongodb';
import Article from '@/models/Article'; // Use the Article model
import { format } from 'date-fns';
import he from 'he';
import DOMPurify from 'isomorphic-dompurify';
import Header from '@/components/layout/Header';
import { Fragment, useEffect } from 'react';
import Script from 'next/script';
import Head from 'next/head'; // <-- 1. IMPORT Head

// Helper component for a single live post
function LiveUpdatePost({ update }) {
  // Sanitize the 'liveContent' field
  const decodedContent = he.decode(update.liveContent || "");
  const sanitizedContent = DOMPurify.sanitize(decodedContent, {
    ADD_TAGS: [
      'h2', 'h3', 'p', 'strong', 'em', 'u', 's', 
      'blockquote', 'pre', 'span', 'sub', 'sup', 'ol', 'ul', 'li', 
      'a', 'img', 'iframe', 'br', 'hr', 'div',
    ],
    ADD_ATTR: [
      'href', 'src', 'alt', 'title', 'class', 'style', 'width', 'height', 
      'frameborder', 'allow', 'allowfullscreen', 'target', 'cite', 
      'data-width', 'data-height', 'async'
    ],
  });

  // Reload embeds (like Twitter)
  useEffect(() => {
    if (window.twttr && window.twttr.widgets) {
      window.twttr.widgets.load();
    }
    if (window.instgrm && window.instgrm.Embeds) {
      window.instgrm.Embeds.process();
    }
  }, [update._id]); // Re-run when the post renders

  return (
    <article className="rounded-lg bg-white p-5 shadow-lg relative">
      {/* Red live dot */}
      <span className="absolute top-5 left-[-8px] h-3 w-3 rounded-full bg-red-500">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
      </span>
      
      <p className="mb-2 text-xs font-semibold text-red-600">
        {format(new Date(update.publishedDate), "MMMM d, yyyy 'at' hh:mm a")}
      </p>
      
      {/* Render the 'liveContent' from the Article model */}
      <div 
        className="prose max-w-none prose-p:my-2 prose-img:rounded-lg"
        dangerouslySetInnerHTML={{ __html: sanitizedContent }} 
      />
      
      <p className="mt-3 text-xs font-medium text-gray-500">
        By {update.author}
      </p>
    </article>
  );
}

// THIS IS THE UPDATED PAGE COMPONENT
export default function LiveFeedPage({ updates }) {
  
  // --- 2. CREATE THE SCHEMA ---
  const getCoverageTimes = () => {
    if (!updates || updates.length === 0) {
      const now = new Date().toISOString();
      return { startTime: now, endTime: now };
    }
    // Newest post (top of the page)
    const endTime = new Date(updates[0].publishedDate).toISOString();
    // Oldest post (bottom of the page)
    const startTime = new Date(updates[updates.length - 1].publishedDate).toISOString();
    return { startTime, endTime };
  };

  const { startTime, endTime } = getCoverageTimes();

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "LiveBlogPosting",
    "headline": "Live Updates - TeluguShorts",
    "description": "The latest breaking news and live updates from TeluguShorts.",
    "coverageStartTime": startTime,
    "coverageEndTime": endTime,
    "publisher": {
      "@type": "Organization",
      "name": "TeluguShorts",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.telugushorts.com/logo.png" // <-- IMPORTANT: Add a real logo URL here
      }
    },
    // This loops through your live posts and creates an "update" for each one
    "liveBlogUpdate": updates.map(update => {
      return {
        "@type": "BlogPosting",
        // Use a snippet of content as the headline
        "headline": (update.liveContent || "Live Update").substring(0, 110).replace(/<[^>]+>/g, '') + "...",
        "datePublished": new Date(update.publishedDate).toISOString(),
        "dateModified": new Date(update.updatedAt).toISOString(),
        "author": {
          "@type": "Person",
          "name": update.author
        },
        "articleBody": update.liveContent
      }
    })
  };
  // --- END OF SCHEMA ---

  return (
    <Fragment> 
      <SeoHead 
        title="Live Updates" 
        description="The latest breaking news and live updates."
      />
      
      {/* --- 3. ADD THE SCHEMA TO YOUR <Head> --- */}
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
        />
      </Head>
      
      {/* --- Embed Scripts --- */}
      <Script src="https://platform.twitter.com/widgets.js" strategy="lazyOnload" />
      <Script src="//www.instagram.com/embed.js" strategy="lazyOnload" />
      
      <Header />
      
      <main className="container mx-auto max-w-3xl px-4 py-8">
        <div>
          <h1 className="mb-6 text-3xl font-bold text-gray-900">
            Live Updates
          </h1>
          
          <div className="flex flex-col gap-8">
            {updates.length > 0 ? (
              updates.map((update) => (
                <LiveUpdatePost key={update._id} update={update} />
              ))
            ) : (
              <p className="text-gray-500">No live updates at the moment.</p>
            )}
          </div>
        </div>
      </main>
    </Fragment>
  );
}

// Use SSR (getServerSideProps) for a real-time feed
export async function getServerSideProps(context) {
  await dbConnect();
  const now = new Date();
  
  // It fetches from the 'Article' collection
  const result = await Article.find({
    isFullArticle: false, // Only show "live points"
    status: 'published',
    publishedDate: { $lte: now }
  })
    .sort({ publishedDate: -1 }) // Sort by the publish date
    .limit(20); // Get the 20 most recent live updates

  // Serialize the data
  const updates = result.map((doc) => {
    const update = doc.toObject();
    update._id = update._id.toString();
    update.createdAt = update.createdAt.toString();
    update.updatedAt = update.updatedAt.toString();
    update.publishedDate = update.publishedDate.toString();
    return update;
  });

  return {
    props: {
      updates: updates,
    },
    // No 'revalidate' - this page is fetched live every time
  };
}
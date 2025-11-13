import SeoHead from '@/components/SeoHead';
import dbConnect from '@/lib/mongodb';
import Article from '@/models/Article';
import { format } from 'date-fns';
import he from 'he';
import DOMPurify from 'isomorphic-dompurify';
import Header from '@/components/layout/Header';
import { Fragment, useEffect } from 'react'; // <-- 1. Import Fragment and useEffect
import Script from 'next/script'; // <-- 2. Import Script

// Helper component for a single live post
function LiveUpdatePost({ update }) {
  
  // --- 3. THIS IS THE FIX ---
  // Upgrade the sanitizer to allow all rich text editor tags
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
  // --- END OF FIX ---

  // --- 4. Add useEffect to load embeds ---
  // This tells Twitter/Instagram to scan this post for embeds
  useEffect(() => {
    if (window.twttr && window.twttr.widgets) {
      window.twttr.widgets.load();
    }
    if (window.instgrm && window.instgrm.Embeds) {
      window.instgrm.Embeds.process();
    }
  }, [update._id]); // Re-run every time a new post renders
  // --- END ---

  return (
    <article className="rounded-lg bg-white p-5 shadow-lg relative">
      {/* Red live dot */}
      <span className="absolute top-5 left-[-8px] h-3 w-3 rounded-full bg-red-500">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
      </span>
      
      <p className="mb-2 text-xs font-semibold text-red-600">
        {format(new Date(update.publishedDate), "MMMM d, yyyy 'at' hh:mm a")}
      </p>
      
      {/* This will now correctly render embeds */}
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

// This is the main page component
export default function LiveFeedPage({ updates }) {
  return (
    <Fragment> {/* <-- 5. Use Fragment */}
      <SeoHead 
        title="Live Updates" 
        description="The latest breaking news and live updates."
      />

      {/* --- 6. ADD EMBED SCRIPTS --- */}
      <Script
        src="https://platform.twitter.com/widgets.js"
        strategy="lazyOnload"
      />
      <Script src="//www.instagram.com/embed.js" strategy="lazyOnload" />
      {/* --- END --- */}

      
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

// ... (getServerSideProps function is unchanged and correct) ...
export async function getServerSideProps(context) {
  await dbConnect();
  const now = new Date();
  
  const result = await Article.find({
    isFullArticle: false, // Only show "live points"
    status: 'published',
    publishedDate: { $lte: now }
  })
    .sort({ publishedDate: -1 }) // Sort by the publish date
    .limit(20);

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
  };
}
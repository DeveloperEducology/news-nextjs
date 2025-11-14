import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { Fragment, useEffect } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import he from 'he';
import ShareButtons from './ShareButtons';

// --- Define Your Trusted Domains ---
const OPTIMIZED_DOMAINS = [
  'cakeimages.s3.ap-northeast-2.amazonaws.com',
  'via.placeholder.com',
];

export default function LivePost({ article, priority = false }) {
  
  // --- Check if image is external ---
  let isExternalDomain = true;
  if (article.featuredImage) {
    try {
      const url = new URL(article.featuredImage);
      if (OPTIMIZED_DOMAINS.includes(url.hostname)) isExternalDomain = false;
    } catch {
      isExternalDomain = true;
    }
  }

  // --- Content Cleaning & Sanitizing ---
  const decodedContent = he.decode(article.content || "");
  const cleanedContent = decodedContent.replace(/(\n|\s|&nbsp;)+<([a-z])/g, '<$2').trim();
  const sanitizedContent = DOMPurify.sanitize(cleanedContent, {
    ADD_TAGS: ['h2', 'h3', 'p', 'strong', 'em', 'u', 's', 'blockquote', 'pre', 'span', 'sub', 'sup', 'ol', 'ul', 'li', 'a', 'img', 'iframe', 'br', 'hr', 'div'],
    ADD_ATTR: ['href', 'src', 'alt', 'title', 'class', 'style', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen', 'target'],
  });

  // --- Reload embeds (like Twitter) ---
  useEffect(() => {
    if (window.twttr && window.twttr.widgets) {
      window.twttr.widgets.load();
    }
    if (window.instgrm && window.instgrm.Embeds) {
      window.instgrm.Embeds.process();
    }
  }, [article._id]); // Re-run when the post ID changes

  return (
    <article className="rounded-lg bg-white p-6 shadow-lg">
      
      {/* Post Header */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500">
          {format(new Date(article.createdAt), "MMMM d, yyyy 'at' hh:mm a")}
        </span>
        <ShareButtons title={article.title} slug={article.slug} />
      </div>

      {/* Title */}
      <h1 className="mb-4 text-2xl font-bold text-gray-900 md:text-3xl">
        <Link href={`/article/${article.slug}`} className="hover:underline">
          {article.title}
        </Link>
      </h1>

      {/* Featured Image */}
      {article.featuredImage && (
        <div className="relative mb-6 w-full h-64 md:h-96">
          <Image
            src={article.featuredImage}
            alt={article.title}
            fill
            className="rounded-lg object-cover"
            priority={priority} // Prioritize the first image
            unoptimized={isExternalDomain}
          />
        </div>
      )}

      {/* Featured Video (if it exists) */}
      {article.featuredVideo && (
        <div className="mb-6 w-full aspect-video">
          <video
            src={article.featuredVideo}
            controls
            className="w-full rounded-lg"
          >
            Your browser does not support the video tag.
          </video>
        </div>
      )}

      {/* Main Content */}
      <div
        className="prose prose-lg max-w-none prose-img:rounded-lg"
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      />

    </article>
  );
}
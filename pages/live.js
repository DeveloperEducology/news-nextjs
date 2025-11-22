import SeoHead from '@/components/SeoHead';
import dbConnect from '@/lib/mongodb';
import Article from '@/models/Article';
import { format } from 'date-fns';
import he from 'he';
import DOMPurify from 'isomorphic-dompurify';
import { Fragment, useEffect } from 'react';
import Script from 'next/script';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';

const OPTIMIZED_DOMAINS = [
  'cakeimages.s3.ap-northeast-2.amazonaws.com',
  'via.placeholder.com',
];

// Escape HTML for JSON-LD to prevent DOM break
function escapeForJsonLd(str = "") {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/<\/script/gi, "<\\/script>");
}

// Single Live Update Block
function LiveUpdatePost({ update }) {
  let isExternalDomain = true;

  if (update.featuredImage) {
    try {
      const url = new URL(update.featuredImage);
      if (OPTIMIZED_DOMAINS.includes(url.hostname)) isExternalDomain = false;
    } catch {
      isExternalDomain = true;
    }
  }

  const decodedContent = he.decode(update.liveContent || "");
  const sanitizedContent = DOMPurify.sanitize(decodedContent, {
    ADD_TAGS: [
      'h2', 'h3', 'p', 'strong', 'em', 'u', 's', 'blockquote', 'pre',
      'span', 'sub', 'sup', 'ol', 'ul', 'li', 'a', 'img', 'iframe',
      'br', 'hr', 'div',
    ],
    ADD_ATTR: [
      'href', 'src', 'alt', 'title', 'class', 'style', 'width', 'height',
      'frameborder', 'allow', 'allowfullscreen', 'target', 'cite',
      'data-width', 'data-height', 'async'
    ],
  });

  useEffect(() => {
    if (window.twttr?.widgets) window.twttr.widgets.load();
    if (window.instgrm?.Embeds) window.instgrm.Embeds.process();
  }, [update._id]);

  return (
    <article className="rounded-lg bg-white p-5 shadow-lg relative">
      <span className="absolute top-5 left-[-8px] h-3 w-3 rounded-full bg-red-500">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
      </span>

      <p className="mb-2 text-xs font-semibold text-red-600">
        {format(new Date(update.publishedDate), "MMMM d, yyyy 'at' hh:mm a")}
      </p>

      <h2 className="mb-3 text-2xl font-bold text-gray-900">
        <Link href={`/article/${update.slug}`} className="hover:underline">
          {update.title}
        </Link>
      </h2>

      {update.featuredImage && (
        <div className="relative mb-4 w-full h-64 md:h-80">
          <Image
            src={update.featuredImage}
            alt={update.title}
            fill
            className="rounded-lg object-cover"
            unoptimized={isExternalDomain}
          />
        </div>
      )}

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

// PAGE COMPONENT
export default function LiveFeedPage({ updates }) {

  const getCoverageTimes = () => {
    if (!updates.length) {
      const now = new Date().toISOString();
      return { startTime: now, endTime: now };
    }
    const endTime = new Date(updates[0].publishedDate).toISOString();
    const startTime = new Date(updates[updates.length - 1].publishedDate).toISOString();
    return { startTime, endTime };
  };

  const { startTime, endTime } = getCoverageTimes();

  // SAFE JSON-LD DATA
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
        "url": "https://www.telugushorts.com/logo.png"
      }
    },
    "liveBlogUpdate": updates.map(update => ({
      "@type": "BlogPosting",
      "headline": update.title,
      "datePublished": new Date(update.publishedDate).toISOString(),
      "dateModified": new Date(update.updatedAt).toISOString(),
      "author": { "@type": "Person", "name": update.author },
      "articleBody": escapeForJsonLd(update.liveContent || "")
    }))
  };

  return (
    <Fragment>
      <SeoHead
        title="Live Updates"
        description="The latest breaking news and live updates."
      />

      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schemaData).replace(/<\/script/gi, "<\\/script")
          }}
        />
      </Head>

      <Script src="https://platform.twitter.com/widgets.js" strategy="afterInteractive" />
      <Script src="//www.instagram.com/embed.js" strategy="afterInteractive" />

      <main className="container mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold text-gray-900">
          Live Updates
        </h1>

        <div className="flex flex-col gap-8">
          {updates.length ? (
            updates.map(update => (
              <LiveUpdatePost key={update._id} update={update} />
            ))
          ) : (
            <p className="text-gray-500">No live updates at the moment.</p>
          )}
        </div>
      </main>
    </Fragment>
  );
}

// SERVER-SIDE PROPS
export async function getServerSideProps() {
  await dbConnect();
  const now = new Date();

  const result = await Article.find({
    isFullArticle: false,
    status: "published",
    publishedDate: { $lte: now }
  })
    .sort({ publishedDate: -1 })
    .limit(20);

  const updates = result.map(doc => {
    const update = doc.toObject();
    update._id = update._id.toString();
    update.createdAt = update.createdAt.toString();
    update.updatedAt = update.updatedAt.toString();
    update.publishedDate = update.publishedDate.toString();
    update.title = update.title || "Live Update";
    update.slug = update.slug;
    update.featuredImage = update.featuredImage || null;
    return update;
  });

  return { props: { updates } };
}

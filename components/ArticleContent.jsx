// components/ArticleContent.jsx
import { useEffect } from "react";
import DOMPurify from "isomorphic-dompurify";
import he from "he";

export default function ArticleContent({ content = "" }) {
  useEffect(() => {
    if (window.twttr?.widgets) window.twttr.widgets.load();
    if (window.instgrm?.Embeds) window.instgrm.Embeds.process();
  }, []);

  const decoded = he.decode(content);
  const cleaned = decoded.replace(/[\r\n]+/g, "\n").trim();

  const safeHtml = DOMPurify.sanitize(cleaned, {
    USE_PROFILES: { html: true },
    ADD_TAGS: ["iframe"],
    ADD_ATTR: ["allowfullscreen", "frameborder", "scrolling", "data-instgrm-permalink", "style"],
    ALLOWED_URI_REGEXP: /^(?:(?:https?:)?\/\/)(?:[^@\n]+@)?(?:www\.)?(?:twitter\.com|x\.com|instagram\.com|youtube\.com)/i,
  });

  return (
    <div
      className="prose prose-lg max-w-none font-telugu prose-img:rounded-lg prose-img:shadow-md"
      style={{ fontFamily: "'Noto Sans Telugu', sans-serif" }}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}
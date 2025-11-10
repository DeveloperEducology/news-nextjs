import Head from 'next/head';

export default function SeoHead({ title, description, ogImage }) {
  // --- Site-wide Defaults ---
  const siteName = "తెలుగు Shorts";
  const defaultDescription = "The latest news on technology, science, and more.";
  const defaultOgImage = "https://www.your-domain.com/default-og-image.jpg"; // A default image for social sharing
  const twitterHandle = "@YourTwitterHandle";

  // --- Dynamic Values ---
  const pageTitle = title ? `${title} | ${siteName}` : siteName;
  const pageDescription = description || defaultDescription;
  const pageOgImage = ogImage || defaultOgImage;

  return (
    <Head>
      {/* === Primary Tags === */}
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      
      {/* === Open Graph (Facebook, LinkedIn) === */}
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:image" content={pageOgImage} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:type" content="website" />
      <meta name="google-site-verification" content="bw0kT6WT15z5UrQngna89uTbskXuXMl2KBs79K2SCSQ" />

      {/* === Twitter Cards === */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={pageOgImage} />
      {twitterHandle && <meta name="twitter:site" content={twitterHandle} />}
    </Head>
  );
}
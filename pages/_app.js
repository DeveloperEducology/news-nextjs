import '../styles/globals.css';
import Layout from '../components/layout/Layout';
import { SessionProvider } from "next-auth/react";
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Script from 'next/script';
import * as gtag from '../lib/gtag';

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  const router = useRouter();

  useEffect(() => {
    const handleRouteChange = (url) => {
      gtag.pageview(url);
    };
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  // --- THIS IS THE UPDATE ---
  // Check if the current page is the shorts page
  const isShortsPage = router.pathname === '/shorts';
  // --- END OF UPDATE ---

  return (
    <SessionProvider session={session}>
      
      
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${gtag.GA_TRACKING_ID}`}
      />
      <Script
        id="gtag-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gtag.GA_TRACKING_ID}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
   
      {/* --- THIS IS THE UPDATE --- */}
      {/* Conditionally render the Layout */}
      {isShortsPage ? (
        <Component {...pageProps} /> // Render the page with NO layout
      ) : (
        <Layout>
          <Component {...pageProps} /> {/* Render other pages WITH the layout */}
        </Layout>
      )}
      {/* --- END OF UPDATE --- */}
      
    </SessionProvider>
  );
}

import '@/styles/globals.css';
import Layout from '../components/layout/Layout';
import { SessionProvider } from "next-auth/react"; // <-- IMPORT
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Script from 'next/script';
// import * as gtag from '../lib/gtag';

// THIS IS THE CORRECT ORDER
export default function App({ Component, pageProps: { session, ...pageProps } }) {
  const router = useRouter();

  // useEffect(() => {
  //   const handleRouteChange = (url) => {
  //     gtag.pageview(url);
  //   };
  //   router.events.on('routeChangeComplete', handleRouteChange);
  //   return () => {
  //     router.events.off('routeChangeComplete', handleRouteChange);
  //   };
  // }, [router.events]);

  return (
    // 1. SessionProvider MUST be on the outside
    <SessionProvider session={session}>
      
      {/* Analytics Scripts */}
      {/* <Script
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
       */}
      {/* 2. Layout is INSIDE the provider */}
      <Layout>
        <Component {...pageProps} />
      </Layout>
      
    </SessionProvider>
  );
}
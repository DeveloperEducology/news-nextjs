import '../styles/globals.css';
import Layout from '../components/layout/Layout';
import { SessionProvider } from "next-auth/react";
import { useRouter } from 'next/router';
import { GoogleAnalytics } from '@next/third-parties/google'; // <-- 1. IMPORT

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  const router = useRouter();

  // --- THIS IS THE UPDATE ---
  // Check if the current page is the shorts page
  const isShortsPage = router.pathname === '/shorts';
  // --- END OF UPDATE ---

  return (
    <SessionProvider session={session}>

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

      {/* 2. ADD THE COMPONENT HERE AT THE END */}
      {/* It automatically handles page views */}
      <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />

    </SessionProvider>
  );
}
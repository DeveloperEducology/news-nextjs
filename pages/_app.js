import '../styles/globals.css';
import Layout from '../components/layout/Layout';
import { SessionProvider } from "next-auth/react";
import { useRouter } from 'next/router';
import { GoogleAnalytics } from '@next/third-parties/google';

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}) {

  return (
    <SessionProvider session={session}>
      {/* We removed the conditional logic here.
        The <Layout> component (and its Header) will now
        be rendered on EVERY page.
      */}
      <Layout>
        <Component {...pageProps} />
      </Layout>

      <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
    </SessionProvider>
  );
}
import '../styles/globals.css';
import 'react-quill-new/dist/quill.snow.css'; // Your rich text editor CSS
import Layout from '../components/layout/Layout';
import { SessionProvider } from "next-auth/react";
import { GoogleAnalytics } from '@next/third-parties/google';

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}) {

  return (
    <SessionProvider session={session}>
      
      {/* The Layout component now wraps EVERY page */}
      <Layout>
        <Component {...pageProps} />
      </Layout>

      <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
    </SessionProvider>
  );
}
import '@/styles/globals.css';
import Layout from '../components/layout/Layout'; // <-- IMPORT

export default function App({ Component, pageProps }) {
  return (
    <Layout> {/* <-- WRAP HERE */}
      <Component {...pageProps} />
    </Layout>
  );
}
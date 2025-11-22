import { getSession } from "next-auth/react";
import { useState } from 'react';
import SeoHead from '@/components/SeoHead';

export default function FetchTweetsPage() {
  const [tweetIds, setTweetIds] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleFetch = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');
    
    // Convert text area list to a clean array
    const idArray = tweetIds.split('\n').map(id => id.split('/').pop().trim()).filter(Boolean);
    
    if (idArray.length === 0) {
      setError("Please paste at least one Tweet ID or URL.");
      setIsLoading(false);
      return;
    }
    
    try {
      const res = await fetch('/api/fetch-and-save-tweet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tweet_ids: idArray }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Fetch failed');
      }
      
      setMessage(data.message);
      if (data.failedIds.length > 0) {
        setError(`Failed to process: ${JSON.stringify(data.failedIds)}`);
      }
      setTweetIds(''); // Clear the form
      
    } catch (err) {
      setError(`Error: ${err.message}`);
    }
    
    setIsLoading(false);
  };

  return (
    <>
      <SeoHead title="Fetch Tweets" />
      <div className="container mx-auto max-w-lg px-4 py-8">
        <form onSubmit={handleFetch} className="rounded-lg bg-white p-6 shadow-lg">
          <h1 className="mb-4 text-2xl font-bold">Fetch Tweets & Save</h1>
          <p className="mb-4 text-gray-600">
            Paste one or more Tweet URLs or IDs, separated by a new line. The system will
            fetch, translate, and save them as new "Live Update" posts.
          </p>
          
          <textarea
            rows="10"
            className="mt-1 block w-full rounded-md border-gray-300 font-mono text-sm shadow-sm"
            placeholder="https://x.com/user/status/12345..."
            value={tweetIds}
            onChange={(e) => setTweetIds(e.target.value)}
          />
          
          <button
            type="submit"
            disabled={isLoading}
            className="mt-4 w-full rounded-md bg-blue-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isLoading ? 'Fetching...' : 'Fetch & Save'}
          </button>
          
          {message && (
            <p className="mt-4 rounded-md bg-green-100 p-4 text-sm font-medium text-green-800">
              {message}
            </p>
          )}
          {error && (
            <p className="mt-4 rounded-md bg-red-100 p-4 text-sm font-medium text-red-800">
              {error}
            </p>
          )}
        </form>
      </div>
    </>
  );
}

// Protect this page
export async function getServerSideProps(context) {
  const session = await getSession(context);
  if (!session || session.user.role !== "admin") {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }
  return { props: { session } };
}
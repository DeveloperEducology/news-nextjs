import { useState } from "react";
import { getSession } from "next-auth/react";
import SeoHead from "@/components/SeoHead";
import Link from "next/link";

export default function BulkImportPage() {
  const [jsonInput, setJsonInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success'|'error', msg: '' }

  const handleImport = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus(null);

    try {
      // 1. Validate JSON format before sending
      let parsedData;
      try {
        parsedData = JSON.parse(jsonInput);
      } catch (err) {
        throw new Error("Invalid JSON format. Please check your syntax.");
      }

      if (!Array.isArray(parsedData)) {
        throw new Error("Data must be an array: [ { ... }, { ... } ]");
      }

      // 2. Send to API
      const res = await fetch("/api/admin/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Import failed.");
      }

      setStatus({
        type: "success",
        msg: `${data.message} (Created: ${data.inserted}, Updated: ${data.updated})`,
      });
      setJsonInput(""); // Clear form on success
    } catch (err) {
      setStatus({ type: "error", msg: err.message });
    }

    setIsLoading(false);
  };

  return (
    <>
      <SeoHead title="Bulk Import" />
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Bulk Import Articles</h1>
          <Link href="/admin" className="text-sm font-medium text-blue-600 hover:underline">
            ← Back to Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <p className="mb-4 text-gray-600">
            Paste a JSON array of article objects below. <br />
            <span className="text-xs bg-gray-100 p-1 rounded">
              [ {"{"} "title": "...", "slug": "...", ... {"}"}, ... ]
            </span>
          </p>

          <form onSubmit={handleImport}>
            <textarea
              rows="15"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 font-mono text-xs p-4 bg-slate-50"
              placeholder='[
  {
    "title": "Example Article",
    "slug": "example-article",
    ...
  }
]'
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
            />

            {status && (
              <div
                className={`mt-4 p-4 rounded-md ${
                  status.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
                }`}
              >
                <p className="font-medium">{status.type === "success" ? "Success!" : "Error"}</p>
                <p>{status.msg}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !jsonInput}
              className="mt-6 w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
            >
              {isLoading ? "Processing..." : "Import Array"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

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
  return { props: {} };
}

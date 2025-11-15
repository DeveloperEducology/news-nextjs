import { google } from 'googleapis';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../pages/api/auth/[...nextauth]";

// The full URL of your site
const BASE_URL = 'https://www.telugushorts.com';

// Define the scope for the Indexing API
const SCOPES = ['https://www.googleapis.com/auth/indexing'];

// Function to get an authenticated Google API client
async function getAuthClient() {
  const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  
  const jwtClient = new google.auth.JWT(
    serviceAccount.client_email,
    null,
    serviceAccount.private_key,
    SCOPES,
    null
  );

  await jwtClient.authorize();
  return jwtClient;
}

export default async function handler(req, res) {
  // 1. Secure this endpoint
  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user.role !== "admin") {
    return res.status(403).json({ success: false, error: "Forbidden" });
  }

  // 2. Get the URL to index from the request
  const { urlPath, type } = req.body; // e.g., "/article/my-slug"
  if (!urlPath || !type) {
    return res.status(400).json({ error: 'Missing urlPath or type' });
  }
  
  const fullUrl = `${BASE_URL}${urlPath}`;

  try {
    const auth = await getAuthClient();
    const indexing = google.indexing({ version: 'v3', auth });

    // 3. Send the request to Google
    const result = await indexing.urlNotifications.publish({
      requestBody: {
        url: fullUrl,
        type: type, // 'URL_UPDATED' or 'URL_DELETED'
      },
    });

    res.status(200).json({ success: true, data: result.data });
  } catch (error) {
    console.error("Indexing API error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
}

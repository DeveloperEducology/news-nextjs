// This is a simple API route that does nothing except say "OK".
// This is perfect for a pinger because it's very fast and uses few resources.
export default function handler(req, res) {
  res.status(200).json({ status: 'ok' });
}
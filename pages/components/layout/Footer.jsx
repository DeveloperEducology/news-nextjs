export default function Footer() {
  return (
    <footer className="bg-gray-800 text-gray-300 py-6 mt-8">
      <div className="container mx-auto max-w-5xl px-4 text-center">
        &copy; {new Date().getFullYear()} తెలుగు Shorts. All rights reserved.
      </div>
    </footer>
  );
}
// import Link from 'next/link';

// export default function Header() {
//   return (
//     <header className="bg-white shadow-md">
//       <div className="container mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
//         <Link href="/" legacyBehavior>
//           <a className="text-2xl font-bold text-gray-800">తెలుగు Shorts</a>
//         </Link>
//         <nav>
//           <Link href="/create-article" legacyBehavior>
//             <a className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
//               Create Post
//             </a>
//           </Link>
//         </nav>
//       </div>
//     </header>
//   );
// }

import Link from 'next/link';
import { useSession, signIn, signOut } from "next-auth/react";
import Image from 'next/image';

export default function Header() {
  const { data: session, status } = useSession(); // Get session data

  console.log(session)

  const isLoading = status === "loading";

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" legacyBehavior>
          <a className="text-2xl font-bold text-gray-800">తెలుగు Shorts</a>
        </Link>
        
        <nav className="flex items-center gap-4">
         <Link href="/gallery" className="text-sm font-medium text-gray-600 hover:text-blue-600">
    Gallery
  </Link>
  {/* --- ADD THIS LINK --- */}
          <Link href="/shorts" className="text-sm font-medium text-gray-600 hover:text-blue-600">
            Shorts
          </Link>
          {/* --- END OF LINK --- */}
          {/* --- AUTHENTICATION BUTTONS --- */}
          {isLoading ? (
            <div className="h-8 w-16 animate-pulse rounded-md bg-gray-200"></div>
          ) : session ? (
            // User is Signed In
            <>
              {/* --- THIS IS THE CHANGE --- */}
              {session?.user.role === 'admin' && (
                <Link href="/admin" legacyBehavior>
                  <a className="text-sm font-medium text-red-600 hover:text-red-800">
                    Dashboard
                  </a>
                </Link>
              )}
              {/* --- END OF CHANGE --- */}

              <Image
                src={session.user.image}
                alt={session.user.name}
                width={32}
                height={32}
                className="rounded-full"
              />
              <button
                onClick={() => signOut()}
                className="rounded-md bg-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
              >
                Sign Out
              </button>
            </>
          ) : (
            // User is Signed Out
            <button
              onClick={() => signIn()}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Sign In
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
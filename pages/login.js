import { signIn, getCsrfToken } from "next-auth/react";
import SeoHead from "../components/SeoHead";
import { useRouter } from "next/router";
import Link from "next/link";
import { useState } from "react";

// We use getServerSideProps to get the CSRF token
export async function getServerSideProps(context) {
  return {
    props: {
      csrfToken: await getCsrfToken(context),
    },
  };
}

export default function LoginPage({ csrfToken }) {
  const router = useRouter();
  const [error, setError] = useState(router.query.error || null);

  // This handles the form submission
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    
    const email = e.currentTarget.email.value;
    const password = e.currentTarget.password.value;

    const result = await signIn("credentials", {
      redirect: false, // We will handle redirect manually
      email: email,
      password: password,
    });

    if (result.error) {
      // Show the error from NextAuth (e.g., "Incorrect password")
      setError(result.error);
    } else {
      // Success, redirect to homepage
      router.push("/");
    }
  };

  return (
    <>
      <SeoHead title="Login" />
      <div className="container mx-auto max-w-sm px-4 py-16">
        <div className="rounded-lg bg-white p-8 shadow-lg">
          
          <h1 className="mb-6 text-center text-2xl font-bold">Sign In</h1>

          {/* --- EMAIL/PASSWORD FORM --- */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Hidden CSRF Token */}
            <input name="csrfToken" type="hidden" defaultValue={csrfToken} />
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                name="email"
                type="email"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                name="password"
                type="password"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {/* Show error message */}
            {error && (
              <div className="rounded-md bg-red-50 p-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            )}
            
            <button
              type="submit"
              className="w-full rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700"
            >
              Sign In
            </button>
          </form>
          {/* --- END FORM --- */}
          
          <div className="my-6 flex items-center">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="mx-4 flex-shrink text-sm text-gray-500">OR</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>
          
          {/* --- GOOGLE SIGN IN BUTTON --- */}
          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 px-4 py-3 font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            {/* <FcGoogle className="h-6 w-6" /> */}
            <span>Sign in with Google</span>
          </button>
          
          <p className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <Link href="/register" legacyBehavior>
              <a className="font-medium text-blue-600 hover:underline">
                Sign Up
              </a>
            </Link>
          </p>

        </div>
      </div>
    </>
  );
}
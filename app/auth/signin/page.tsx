'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (process.env.NODE_ENV === "development") {
      console.log("🔐 Attempting sign in with:", { email });
    }

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (process.env.NODE_ENV === "development") {
      console.log("🔐 signIn result:", res);
    }

    if (!res || res.error) {
      console.warn("❌ Login failed:", res?.error);
      setError("Invalid credentials. Please try again.");
    } else {
      console.log("✅ Login successful! Redirecting...");
      // 🔁 Redirect to your deployed AI assistant app (or change if needed)
      router.push("https://app.mycustodycoach.com/");
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white shadow-md rounded p-8 w-full max-w-md">
        <h1 className="text-xl font-semibold text-center mb-6 text-gray-800">
          Sign In to MyCustodyCoach
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full mt-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full mt-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-4 text-sm text-center text-gray-600">
          Don’t have an account?{" "}
          <a href="/auth/signup" className="text-blue-600 hover:underline">
            Sign up here
          </a>
        </p>

        <p className="mt-1 text-xs text-center text-gray-500">
          <a href="#" className="underline">Forgot Email</a> or{" "}
          <a href="#" className="underline">Password</a>
        </p>
      </div>
    </main>
  );
}
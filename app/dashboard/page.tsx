import { getServerSession } from "next-auth/next"; // or unstable_getServerSession if needed
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  console.log("📥 Loading DashboardPage...");

  const session = await getServerSession(authOptions);
  console.log("✅ Session data received:", session);

  if (!session) {
    console.warn("🚫 No session found, redirecting to /auth/signin");
    redirect("/auth/signin");
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-3xl mx-auto bg-white shadow-md rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-4">Welcome to MyCustodyCoach</h1>
        <p className="text-lg text-gray-700">
          Hello,{" "}
          <span className="font-semibold">
            {session.user.firstName ?? session.user.email}
          </span>
          !
        </p>
        <p className="mt-2">
          Your state:{" "}
          <strong>{session.user.state ?? "Not specified"}</strong>
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Email: {session.user.email}
        </p>
      </div>
    </main>
  );
}
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import UploadClient from "./UploadClient";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <UploadClient
      user={{
        email: session.user.email!,
        firstName: session.user.firstName || "",
        state: session.user.state || "",
      }}
    />
  );
}
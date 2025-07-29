import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import NewIssuePage from "@/components/NewIssuePage";
import SignUp from "../../(auth)/sign-up/page";

type Session = {
  user: {
    role?: string;
    id: string;
    email: string;
    emailVerified: boolean;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    image?: string | null;
  };
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
    token: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  };
};

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Debugging: session içeriğini sunucu tarafında logla
  console.log(
    "Server session in NewIssuePage wrapper:",
    JSON.stringify(session, null, 2)
  );

  return (
    <>
      {session ? (
        <NewIssuePage session={session} />
      ) : (
        <div className="flex items-center justify-center h-screen">
          <SignUp />
        </div>
      )}
    </>
  );
}

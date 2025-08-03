import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import NewIssuePage from "@/components/NewIssuePage";
import SignUp from "../../(auth)/sign-up/page";

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

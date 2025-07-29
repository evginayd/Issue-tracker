import IssueTable from "@/components/IssueTable";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import SignUp from "../(auth)/sign-up/page";

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return (
    <>
      {session ? (
        <div>
          <div className="mt-7 max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-10 gap-6">
            <div className="lg:col-span-full">
              <IssueTable session={session} />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-screen">
          <SignUp />
        </div>
      )}
    </>
  );
}

import UserDetailPage from "@/components/UserDetailWrapper";
import { auth } from "@/lib/auth"; // better-auth
import { headers } from "next/headers";

export default async function UserDetailWrapper({
  params,
}: {
  params: { userId: string };
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const res = await fetch(
    `http://localhost:3000/api/projects/${params.userId}`,
    {
      headers: await headers(),
      cache: "no-store",
    }
  );
  const user = await res.json();
  if (!session?.user.id || !session?.user.role) {
    // handle the case where session?.user.id is undefined
    return <div>User not found</div>;
  }
  return (
    <UserDetailPage
      user={user}
      currentUserId={session?.user.id}
      currentUserRole={session?.user.role}
      onRoleChange={async (newRole) => {
        "use server";
        await fetch(`/api/users/${user.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: newRole }),
        });
      }}
    />
  );
}

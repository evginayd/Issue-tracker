// app/projects/[id]/page.tsx
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import ProjectDetails from "@/components/ProjectDetails";

async function fetchProject(projectId: string) {
  const res = await fetch(`http://localhost:3000/api/projects/${projectId}`, {
    headers: await headers(),
    cache: "no-store",
  });

  if (!res.ok) {
    if (res.status === 404) notFound();
    throw new Error(await res.text());
  }

  return res.json();
}

export default async function ProjectDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return (
      <div className="text-center mt-10">
        Please sign in to view project details.
      </div>
    );
  }

  const project = await fetchProject(params.id);

  return <ProjectDetails project={project} session={session} />;
}

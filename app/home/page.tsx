import ProjectTable from "@/components/ProjectTable";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import React from "react";

const ProjectView = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return <div>No session found</div>;
  }

  return (
    <div className="mt-7 max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-10 gap-6">
      <div className="lg:col-span-full">
        <ProjectTable session={session.user} />
      </div>
    </div>
  );
};

export default ProjectView;

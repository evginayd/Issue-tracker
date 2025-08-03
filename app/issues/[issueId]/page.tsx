import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import EditIssue from "@/components/EditIssue";

type Status = "OPEN" | "IN_PROGRESS" | "CLOSED";
type Priority = "LOW" | "MEDIUM" | "HIGH";
type Category = "FRONTEND" | "BACKEND" | "DESIGN" | "SUPPORT";
type Role = "DEVELOPER" | "TESTER" | "PROJECT_LEADER" | "MANAGER";

type User = {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  specialty: Category | null;
};

type Issue = {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  category: Category;
  projectId: string;
  assignedById: string;
  codeSnippet: { id: string; content: string }[];
  assignedBy: User;
  assigneeId?: string | null;
  assignee?: User | null;
};

type Session = {
  user: {
    role?: string;
    id: string;
    email: string;
    name: string;
    emailVerified?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    image?: string | null;
  };
};

export default async function IssueDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ issueId: string }>;
  searchParams: { projectId?: string };
}) {
  const { issueId } = await params;
  const projectId = searchParams.projectId || "";

  let session: Session | null;
  try {
    session = await auth.api.getSession({
      headers: await headers(),
    });
  } catch (error) {
    console.error("Failed to fetch session:", error);
    return (
      <div className="text-center mt-10 text-red-500">
        Failed to fetch session. Please sign in.
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center mt-10">
        Please sign in to view issue details.
      </div>
    );
  }

  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: {
      codeSnippet: {
        select: { id: true, content: true },
      },
      assignedBy: {
        select: { id: true, name: true, email: true, role: true },
      },
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          specialty: true,
        },
      },
    },
  });

  if (!issue) {
    notFound();
  }

  if (projectId && issue.projectId !== projectId) {
    notFound();
  }

  return (
    <EditIssue
      session={session}
      issue={{
        id: issue.id,
        title: issue.title,
        description: issue.description || "",
        status: issue.status,
        priority: issue.priority,
        category: issue.category,
        projectId: issue.projectId,
        assignedById: issue.assignedById,
        codeSnippet: issue.codeSnippet
          ? [{ id: issue.codeSnippet.id, content: issue.codeSnippet.content }]
          : [],
        assignedBy: {
          id: issue.assignedBy.id,
          name: issue.assignedBy.name || null,
          email: issue.assignedBy.email,
          role: issue.assignedBy.role,
          specialty: null,
        },
        assigneeId: issue.assigneeId,
        assignee: issue.assignee
          ? {
              id: issue.assignee.id,
              name: issue.assignee.name || null,
              email: issue.assignee.email,
              role: issue.assignee.role,
              specialty: issue.assignee.specialty,
            }
          : null,
      }}
    />
  );
}

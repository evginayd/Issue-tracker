import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  console.log("Session in GET /api/issues:", JSON.stringify(session, null, 2));

  if (!session || !session.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized: Session or user ID missing" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  console.log("Project ID in GET /api/issues:", projectId);

  if (!projectId) {
    return NextResponse.json(
      { error: "Project ID is required" },
      { status: 400 }
    );
  }

  try {
    // Kullanıcının proje ile ilişkisini kontrol et
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        managerId: true,
        members: {
          select: { userId: true },
        },
      },
    });

    console.log(
      "Project authorization check:",
      JSON.stringify(project, null, 2)
    );

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const isManager = project.managerId === session.user.id;
    const isMember = project.members.some(
      (member) => member.userId === session.user.id
    );

    if (!isManager && !isMember) {
      console.log(
        `User ${session.user.id} is not authorized for project ${projectId}`
      );
      return NextResponse.json(
        {
          error:
            "Unauthorized: User is not a manager or member of this project",
        },
        { status: 403 }
      );
    }

    const issues = await prisma.issue.findMany({
      where: { projectId },
      include: {
        project: { select: { id: true, name: true } },
        assignedBy: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
    });

    console.log("Fetched issues:", JSON.stringify(issues, null, 2));
    if (issues.length === 0) {
      console.log("No issues found for projectId:", projectId);
    }
    return NextResponse.json(issues, { status: 200 });
  } catch (error: unknown) {
    console.error("Fetch issues error:", error);
    return NextResponse.json(
      { error: "Failed to fetch issues: " + String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { title, description, projectId, assignedById, codeSnippetId } =
      await request.json();

    if (!title || !projectId || !assignedById) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check project existence
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check user existence
    const user = await prisma.user.findUnique({
      where: { id: assignedById },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check CodeSnippet (optional)
    if (codeSnippetId) {
      const codeSnippet = await prisma.codeSnippet.findUnique({
        where: { id: codeSnippetId },
      });
      if (!codeSnippet) {
        return NextResponse.json(
          { error: "Code snippet not found" },
          { status: 404 }
        );
      }
    }

    // Create Issue
    const issue = await prisma.issue.create({
      data: {
        title,
        description,
        projectId,
        assignedById,
        codeSnippetId: codeSnippetId || null,
        status: "OPEN",
        priority: "MEDIUM",
        category: "DESIGN",
      },
    });

    return NextResponse.json(issue, { status: 201 });
  } catch (error) {
    console.error("Error creating issue:", error);
    return NextResponse.json(
      { error: "Failed to create issue" },
      { status: 500 }
    );
  }
}

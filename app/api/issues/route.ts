import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Category, Priority, Status } from "@prisma/client";

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
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const {
      title,
      description,
      status,
      priority,
      category,
      dueDate,
      labels,
      projectId,
      assignedById,
      assigneeId,
      codeSnippetId,
    } = await request.json();

    // Validate required fields
    if (!title || !projectId || !assignedById) {
      return NextResponse.json(
        { error: "Title, projectId, and assignedById are required" },
        { status: 400 }
      );
    }

    // Validate enum fields
    const validStatuses = Object.values(Status);
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        },
        { status: 400 }
      );
    }
    if (priority && !Object.values(Priority).includes(priority)) {
      return NextResponse.json(
        {
          error: `Invalid priority. Must be one of: ${Object.values(
            Priority
          ).join(", ")}`,
        },
        { status: 400 }
      );
    }
    if (!Object.values(Category).includes(category)) {
      return NextResponse.json(
        {
          error: `Invalid category. Must be one of: ${Object.values(
            Category
          ).join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validate dueDate
    if (dueDate && isNaN(new Date(dueDate).getTime())) {
      return NextResponse.json({ error: "Invalid dueDate" }, { status: 400 });
    }

    // Validate labels
    if (labels && !Array.isArray(labels)) {
      return NextResponse.json(
        { error: "Labels must be an array" },
        { status: 400 }
      );
    }

    // Check project existence
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: { select: { userId: true } } },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check assignedById existence
    const assignedBy = await prisma.user.findUnique({
      where: { id: assignedById },
    });
    if (!assignedBy) {
      return NextResponse.json(
        { error: "AssignedBy user not found" },
        { status: 404 }
      );
    }

    // Check assigneeId existence and project membership if provided
    let assignee = null;
    if (assigneeId) {
      assignee = await prisma.user.findUnique({
        where: { id: assigneeId },
      });
      if (!assignee) {
        return NextResponse.json(
          { error: "Assignee not found" },
          { status: 404 }
        );
      }
      // Optional: Ensure assignee is a project member
      const isMember = project.members.some(
        (member) => member.userId === assigneeId
      );
      if (!isMember) {
        return NextResponse.json(
          { error: "Assignee must be a project member" },
          { status: 400 }
        );
      }
    }

    // Check codeSnippetId existence if provided
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
        description: description || null,
        status: status,
        priority: priority ? priority : null,
        category: category ? category : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        labels: labels || [],
        project: { connect: { id: projectId } },
        assignedBy: { connect: { id: assignedById } },
        assignee: assigneeId ? { connect: { id: assigneeId } } : undefined,
        codeSnippet: codeSnippetId
          ? { connect: { id: codeSnippetId } }
          : undefined,
      },
      include: {
        project: { select: { id: true, name: true } },
        assignedBy: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true } },
        codeSnippet: { select: { id: true, content: true } },
      },
    });

    return NextResponse.json(issue, { status: 201 });
  } catch (error) {
    console.error("Create issue error:", error);
    return NextResponse.json(
      { error: "Failed to create issue" },
      { status: 500 }
    );
  }
}

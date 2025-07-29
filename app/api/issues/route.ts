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
  const session = await auth.api.getSession({ headers: request.headers });
  console.log("Session in POST /api/issues:", JSON.stringify(session, null, 2));

  if (!session || !session.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized: Session or user ID missing" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    console.log("POST body:", JSON.stringify(body, null, 2));
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
    } = body;

    if (!title || !projectId || !assignedById) {
      return NextResponse.json(
        { error: "Title, projectId, and assignedById are required" },
        { status: 400 }
      );
    }

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

    if (!project) {
      return NextResponse.json(
        { error: "Invalid projectId: Project not found" },
        { status: 400 }
      );
    }

    const isManager = project.managerId === session.user.id;
    const isMember = project.members.some(
      (member) => member.userId === session.user.id
    );

    if (!isManager && !isMember) {
      console.log(
        `User ${session.user.id} is not authorized to create issues for project ${projectId}`
      );
      return NextResponse.json(
        {
          error:
            "Unauthorized: User is not a manager or member of this project",
        },
        { status: 403 }
      );
    }

    const issue = await prisma.issue.create({
      data: {
        title,
        description,
        status,
        priority,
        category,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        labels: labels || [],
        projectId,
        assignedById,
        assigneeId: assigneeId || null,
      },
      include: {
        project: { select: { id: true, name: true } },
        assignedBy: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
    });

    console.log("Created issue:", JSON.stringify(issue, null, 2));
    return NextResponse.json(issue, { status: 201 });
  } catch (error: unknown) {
    console.error("Create issue error:", error);
    return NextResponse.json(
      { error: "Failed to create issue: " + String(error) },
      { status: 500 }
    );
  }
}

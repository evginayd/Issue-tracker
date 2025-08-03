import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const issueId = params.id;
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId") || "";

  console.log(
    "GET /api/issues/[id]: issueId =",
    issueId,
    "projectId =",
    projectId
  );

  try {
    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      include: {
        codeSnippet: {
          select: { id: true, content: true },
        },
        assignedBy: {
          select: { name: true },
        },
        assignee: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!issue) {
      console.log(`Issue not found for issueId: ${issueId}`);
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    if (projectId && issue.projectId !== projectId) {
      console.log(
        `Project ID mismatch: issue.projectId = ${issue.projectId}, query projectId = ${projectId}`
      );
      return NextResponse.json(
        { error: "Project ID mismatch" },
        { status: 400 }
      );
    }

    return NextResponse.json(issue, { status: 200 });
  } catch (error) {
    console.error("Error fetching issue:", error);
    return NextResponse.json(
      { error: `Failed to fetch issue: ${error}` },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const issueId = params.id;
  const {
    title,
    description,
    status,
    priority,
    category,
    assignedToId,
    labels,
  } = await request.json();

  console.log("PUT /api/issues/[id]: issueId =", issueId, "data =", {
    title,
    description,
    status,
    priority,
    category,
    assignedToId,
    labels,
  });

  if (!title || !description || !status || !priority || !category) {
    console.log("Missing required fields");
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const validCategories = ["BACKEND", "FRONTEND", "DESIGN", "SUPPORT"];
  if (!validCategories.includes(category)) {
    console.log(`Invalid category: ${category}`);
    return NextResponse.json(
      {
        error: `Invalid category. Must be one of: ${validCategories.join(
          ", "
        )}`,
      },
      { status: 400 }
    );
  }

  try {
    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
    });

    if (!issue) {
      console.log(`Issue not found for issueId: ${issueId}`);
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    const session = await auth.api.getSession({ headers: request.headers });
    if (!session || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const updatedIssue = await prisma.issue.update({
      where: { id: issueId },
      data: {
        title,
        description,
        status,
        priority,
        category,
        assignedBy: {
          connect: { id: session.user.id },
        },
        assignee: assignedToId
          ? { connect: { id: assignedToId } }
          : { disconnect: true },
        labels: {
          set: labels ?? [],
        },
      },
    });

    console.log("Issue updated: id =", updatedIssue.id);
    return NextResponse.json(
      { message: "Issue updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating issue:", error);
    return NextResponse.json(
      { error: `Failed to update issue: ${error}` },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: issueId } = await params;

  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      select: { id: true, projectId: true, codeSnippetId: true },
    });
    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    if (issue.codeSnippetId) {
      return NextResponse.json(
        {
          error: "Cannot delete issue with associated code snippet",
          codeSnippetId: issue.codeSnippetId,
        },
        { status: 400 }
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: issue.projectId },
      select: { managerId: true, members: { select: { userId: true } } },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    const isManager = project.managerId === session.user.id;
    const isMember = project.members.some(
      (member) => member.userId === session.user.id
    );
    if (!isManager && !isMember) {
      return NextResponse.json(
        { error: "Unauthorized: Not a manager or member of this project" },
        { status: 403 }
      );
    }

    await prisma.issue.delete({
      where: { id: issueId },
    });

    return NextResponse.json(
      { message: "Issue deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete issue" },
      { status: 500 }
    );
  }
}

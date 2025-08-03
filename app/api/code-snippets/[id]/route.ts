import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { issueId: string } }
) {
  const { issueId } = params;

  console.log("GET /api/issues/[issueId]: issueId =", issueId);

  try {
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
          select: { id: true, name: true, email: true, role: true },
        },
        project: {
          select: {
            id: true,
            name: true,
            description: true,
            members: {
              select: { userId: true, role: true },
            },
          },
        },
      },
    });

    if (!issue) {
      console.log(`Issue not found for issueId: ${issueId}`);
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
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
  { params }: { params: { issueId: string } }
) {
  const { issueId } = params;
  const { title, description, status, priority, category } =
    await request.json();

  console.log("PUT /api/issues/[issueId]: issueId =", issueId, "data =", {
    title,
    description,
    status,
    priority,
    category,
  });

  if (!title || !description || !status || !priority || !category) {
    console.log("Missing required fields");
    return NextResponse.json(
      { error: "Missing required fields" },
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

    const updatedIssue = await prisma.issue.update({
      where: { id: issueId },
      data: { title, description, status, priority, category },
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
  const { id: codeSnippetId } = await params;

  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session || !session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized: No session found" },
        { status: 403 }
      );
    }

    // Check if CodeSnippet exists
    const codeSnippet = await prisma.codeSnippet.findUnique({
      where: { id: codeSnippetId },
      select: { id: true, projectId: true, issueId: true },
    });
    if (!codeSnippet) {
      return NextResponse.json(
        { error: "Code snippet not found" },
        { status: 404 }
      );
    }

    // Check user authorization (manager or project member)
    const project = await prisma.project.findUnique({
      where: { id: codeSnippet.projectId },
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

    // Delete CodeSnippet and update Issue to clear codeSnippetId
    await prisma.$transaction([
      prisma.issue.updateMany({
        where: { codeSnippetId: codeSnippetId },
        data: { codeSnippetId: null },
      }),
      prisma.codeSnippet.delete({
        where: { id: codeSnippetId },
      }),
    ]);

    return NextResponse.json(
      { message: "Code snippet deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting code snippet:", error);
    return NextResponse.json(
      { error: `Failed to delete code snippet: ${error}` },
      { status: 500 }
    );
  }
}

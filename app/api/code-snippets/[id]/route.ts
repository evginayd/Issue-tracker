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

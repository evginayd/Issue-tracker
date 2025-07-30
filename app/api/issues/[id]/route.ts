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
  const { title, description, status, priority, category } =
    await request.json();

  console.log("PUT /api/issues/[id]: issueId =", issueId, "data =", {
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
  { params }: { params: { id: string } }
) {
  const issueId = params.id;
  console.log("DELETE /api/issues/[id]: issueId =", issueId);

  try {
    const deleted = await prisma.issue.delete({
      where: { id: issueId },
    });
    console.log("Deleted issue:", deleted);
    return NextResponse.json(
      { message: "Deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete issue error:", error);
    return NextResponse.json(
      { error: `Failed to delete issue: ${error}` },
      { status: 500 }
    );
  }
}

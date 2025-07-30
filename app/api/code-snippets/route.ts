import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { content, language, userId, projectId, issueId } =
      await request.json();

    if (!content || !language || !userId || !projectId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (issueId) {
      const issue = await prisma.issue.findUnique({ where: { id: issueId } });
      if (!issue) {
        return NextResponse.json({ error: "Issue not found" }, { status: 404 });
      }
    }

    // Create CodeSnippet
    const codeSnippet = await prisma.codeSnippet.create({
      data: {
        content,
        language,
        userId,
        projectId,
        issueId: issueId || null,
      },
    });

    // Issue ile ilişkilendir (eğer varsa)
    if (issueId) {
      await prisma.issue.update({
        where: { id: issueId },
        data: { codeSnippetId: codeSnippet.id },
      });
    }

    return NextResponse.json({ id: codeSnippet.id }, { status: 201 });
  } catch (error) {
    console.error("Error creating code snippet:", error);
    return NextResponse.json(
      { error: `Failed to create code snippet: ${error}` },
      { status: 500 }
    );
  }
}

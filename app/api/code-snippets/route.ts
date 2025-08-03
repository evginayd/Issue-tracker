import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { content, language, userId, projectId, issueId, codeSnippetId } =
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

    let codeSnippet;
    if (issueId) {
      const issue = await prisma.issue.findUnique({ where: { id: issueId } });
      if (!issue) {
        return NextResponse.json({ error: "Issue not found" }, { status: 404 });
      }

      // Check if a CodeSnippet already exists for this issueId
      const existingSnippet = await prisma.codeSnippet.findFirst({
        where: { issueId },
      });

      if (existingSnippet) {
        // Update existing CodeSnippet
        codeSnippet = await prisma.codeSnippet.update({
          where: { id: existingSnippet.id },
          data: {
            content,
            language,
            userId,
            projectId,
            issueId,
          },
        });
      } else {
        // Create new CodeSnippet
        codeSnippet = await prisma.codeSnippet.create({
          data: {
            content,
            language,
            userId,
            projectId,
            issueId,
          },
        });

        // Update Issue with new codeSnippetId
        await prisma.issue.update({
          where: { id: issueId },
          data: { codeSnippetId: codeSnippet.id },
        });
      }
    } else {
      // Create CodeSnippet without issueId
      codeSnippet = await prisma.codeSnippet.create({
        data: {
          content,
          language,
          userId,
          projectId,
          issueId: null,
        },
      });
    }

    return NextResponse.json({ id: codeSnippet.id }, { status: 201 });
  } catch (error) {
    console.error("Error creating/updating code snippet:", error);
    return NextResponse.json(
      { error: `Failed to create/update code snippet: ${error}` },
      { status: 500 }
    );
  }
}

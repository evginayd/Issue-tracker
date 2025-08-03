import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Member } from "better-auth/plugins";
import { headers } from "next/headers";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params; // params'ı asenkron olarak çöz
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: resolvedParams.id },
      include: {
        manager: true,
        issues: true,
        members: { include: { user: true } },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Kullanıcı proje üyesi veya yönetici değilse erişimi kısıtla
    const isManager = project.managerId === session.user.id;
    const isMember = project.members.some((m) => m.userId === session.user.id);
    if (!isManager && !isMember) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json(project, { status: 200 });
  } catch (error: unknown) {
    console.error("Fetch project error:", error);
    return NextResponse.json(
      { error: "Failed to fetch project: " + error },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session || session.user.role?.toUpperCase() !== "MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { name, description, members } = await request.json();

    // Veri doğrulama
    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Project name is required and must be a string" },
        { status: 400 }
      );
    }
    if (members && !Array.isArray(members)) {
      return NextResponse.json(
        { error: "Members must be an array" },
        { status: 400 }
      );
    }
    if (members && members.some((m: Member) => !m.userId || !m.role)) {
      return NextResponse.json(
        { error: "Each member must have a userId and role" },
        { status: 400 }
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: resolvedParams.id },
      include: { members: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Mevcut üyeleri al
    const existingMembers = project.members.map((m) => ({
      userId: m.userId,
      role: m.role,
    }));
    const newMembers = members || [];

    // Eklenecek ve silinecek üyeleri belirle
    const membersToAdd = newMembers.filter(
      (newM: { userId: string; role: string }) =>
        !existingMembers.some(
          (existingM) =>
            existingM.userId === newM.userId && existingM.role === newM.role
        )
    );
    const membersToRemove = existingMembers.filter(
      (existingM) =>
        !newMembers.some(
          (newM: { userId: string; role: string }) =>
            newM.userId === existingM.userId
        )
    );

    // Prisma işlemi: Proje güncelleme ve üyeleri eşitleme
    const updatedProject = await prisma.project.update({
      where: { id: resolvedParams.id },
      data: {
        name,
        description: description ?? null,
        updatedAt: new Date(),
        members: {
          // Mevcut üyelerden silinmesi gerekenleri kaldır
          deleteMany: {
            userId: { in: membersToRemove.map((m) => m.userId) },
          },
          // Yeni üyeleri ekle
          create: membersToAdd.map(
            (member: { userId: string; role: string }) => ({
              userId: member.userId,
              role: member.role,
            })
          ),
        },
      },
      include: {
        manager: true,
        issues: true,
        members: { include: { user: true } },
      },
    });

    return NextResponse.json(updatedProject, { status: 200 });
  } catch (error: unknown) {
    console.error("Update project error:", error);
    return NextResponse.json(
      { error: "Failed to update project: " + String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session || session.user.role?.toUpperCase() !== "MANAGER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check project and associated records
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        issues: { select: { id: true, title: true } },
      },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.issues.length > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete project with existing issues",
          issueIds: project.issues.map((issue) => ({
            id: issue.id,
            title: issue.title,
          })),
        },
        { status: 400 }
      );
    }

    // Delete project (issues, members, and code snippets handled by onDelete: Cascade)
    await prisma.project.delete({
      where: { id: projectId },
    });

    return NextResponse.json(
      { message: "Project deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    if (error === "P2003") {
      return NextResponse.json(
        { error: "Cannot delete project due to related records" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}

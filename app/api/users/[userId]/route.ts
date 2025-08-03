import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        specialty: true,
        Project: { select: { id: true, name: true } },
        ProjectRole: {
          select: {
            project: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Combine managed projects (Project) and member projects (ProjectRole)
    const projects = [
      ...(user.Project || []),
      ...user.ProjectRole.map((role) => role.project),
    ].reduce((unique, project) => {
      // Deduplicate by project ID
      if (!unique.some((p: { id: string }) => p.id === project.id)) {
        unique.push(project);
      }
      return unique;
    }, [] as { id: string; name: string }[]);

    return NextResponse.json(
      {
        ...user,
        Project: projects,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;
    const { role, specialty } = await request.json();

    const updateData: { role?: string; specialty?: string | null } = {};
    if (role) {
      if (
        !["DEVELOPER", "TESTER", "PROJECT_LEADER", "MANAGER"].includes(role)
      ) {
        return new NextResponse("Invalid role", { status: 400 });
      }
      updateData.role = role;
    }
    if (specialty !== undefined) {
      if (
        specialty &&
        !["FRONTEND", "BACKEND", "DESIGN", "SUPPORT"].includes(specialty)
      ) {
        return new NextResponse("Invalid specialty", { status: 400 });
      }
      updateData.specialty = specialty || null;
    }

    if (Object.keys(updateData).length === 0) {
      return new NextResponse("No valid fields to update", { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role, specialty },
      select: { id: true, role: true, specialty: true },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;
    const user = await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error deleting user:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        specialty: true,
        Project: {
          select: {
            id: true,
            name: true,
          },
        },
        ProjectRole: {
          select: {
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const projects = [
      ...(user.Project || []),
      ...(user.ProjectRole || []).map((role) => role.project),
    ].reduce((unique, project) => {
      return unique.some((p) => p.id === project.id)
        ? unique
        : [...unique, project];
    }, [] as { id: string; name: string }[]);

    return NextResponse.json({
      ...user,
      Project: projects,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;
    const { role } = await request.json();

    if (!["DEVELOPER", "TESTER", "PROJECT_LEADER", "MANAGER"].includes(role)) {
      return new NextResponse("Invalid role", { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, role: true },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating user role:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

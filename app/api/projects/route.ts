import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Role } from "@prisma/client";

// POST /api/projects
export async function POST(req: Request) {
  try {
    // Eğer senin auth paketin farklıysa bu kısmı kendi paketinle değiştir
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user.role || session.user.role !== "MANAGER") {
      return NextResponse.json(
        { error: "Only managers can create projects" },
        { status: 403 }
      );
    }

    const body = await req.json();

    // Beklenen alanlar
    const { name, description, members } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    // 1. Projeyi yarat (managerId sessiondan)
    const project = await prisma.project.create({
      data: {
        name,
        description,
        managerId: session.user.id,
      },
    });

    // 2. Üyeleri ekle (varsa)
    if (Array.isArray(members) && members.length > 0) {
      const membersData = members.map(
        (m: { userId: string; role: string }) => ({
          projectId: project.id,
          userId: m.userId,
          role: Role[m.role.toUpperCase() as keyof typeof Role], // enum cast
        })
      );

      await prisma.projectMember.createMany({
        data: membersData,
        skipDuplicates: true,
      });
    }

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// // GET /api/projects (optional: list all projects)
// export async function GET(req: Request) {
//   try {
//     const { searchParams } = new URL(req.url);

//     const managerId = searchParams.get("managerId");

//     const whereClause = managerId ? { managerId: managerId } : {};

//     const projects = await prisma.project.findMany({
//       where: whereClause,
//       include: {
//         manager: true,
//         members: {
//           include: {
//             user: true,
//           },
//         },
//         issues: true,
//       },
//     });

//     return NextResponse.json(projects, { status: 200 });
//   } catch (error) {
//     console.error("Error fetching projects:", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role");
  const userId = searchParams.get("userId");

  try {
    let projects;

    if (role === "manager" && session.user.role?.toUpperCase() === "MANAGER") {
      // Yönetici için: Kendisinin yönettiği projeleri getir
      projects = await prisma.project.findMany({
        where: { managerId: session.user.id },
        include: {
          manager: { select: { id: true, name: true } },
          issues: { select: { id: true } },
          members: { include: { user: { select: { id: true, name: true } } } },
        },
      });
    } else if (userId && userId === session.user.id) {
      // Diğer roller için: Kullanıcının dahil olduğu projeleri getir
      projects = await prisma.project.findMany({
        where: {
          members: {
            some: { userId: userId },
          },
        },
        include: {
          manager: { select: { id: true, name: true } },
          issues: { select: { id: true } },
          members: { include: { user: { select: { id: true, name: true } } } },
        },
      });
    } else {
      return NextResponse.json(
        { error: "Invalid request parameters or insufficient permissions" },
        { status: 400 }
      );
    }

    return NextResponse.json(projects, { status: 200 });
  } catch (error: unknown) {
    console.error("Fetch projects error:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects: " + String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session || session?.user.role?.toUpperCase() !== "MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { name, description } = await request.json();
  try {
    const project = await prisma.project.update({
      where: { id: params.id },
      data: { name, description },
      include: {
        manager: true,
        issues: true,
        members: { include: { user: true } },
      },
    });
    return NextResponse.json(project);
  } catch (error) {
    console.error("Update project error:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

// export async function DELETE(
//   request: Request,
//   { params }: { params: { id: string } }
// ) {
//   const session = await auth.api.getSession({ headers: request.headers });
//   if (!session || session?.user.role?.toUpperCase() !== "MANAGER") {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
//   }

//   try {
//     await prisma.project.delete({
//       where: { id: params.id },
//     });
//     return NextResponse.json({ message: "Project deleted successfully" });
//   } catch (error) {
//     console.error("Delete project error:", error);
//     return NextResponse.json(
//       { error: "Failed to delete project" },
//       { status: 500 }
//     );
//   }
// }

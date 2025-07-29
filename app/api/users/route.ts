// app/api/users/route.ts
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        role: true, // Eğer rol varsa frontend/backend ayrımı için
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// export async function GET() {
//   try {
//     const users = await prisma.user.findMany({
//       select: {
//         id: true,
//         username: true,
//       },
//     });
//     console.log("Fetched users:", users);
//     return NextResponse.json(users, { status: 200 });
//   } catch (error) {
//     console.error("Failed to fetch users:", error);
//     return NextResponse.json(
//       { error: "Failed to fetch users", details: String(error) },
//       { status: 500 }
//     );
//   }
// }

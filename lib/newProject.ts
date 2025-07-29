"use server";

import { auth } from "./auth";
import { headers } from "next/headers";

export async function newProject() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user || session.user.role !== "MANAGER") {
    return {
      error: "Access denied. Only managers can create new projects.",
    };
  }
  return { success: true };
}

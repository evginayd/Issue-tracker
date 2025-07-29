// If you want to sign in or out from the server side
import { betterAuth } from "better-auth";
import { customSession } from "better-auth/plugins";
import prisma from "./prisma";
import { prismaAdapter } from "better-auth/adapters/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
  },
  plugins: [
    customSession(async ({ user, session }) => {
      const userData = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { role: true },
      });

      return {
        user: {
          ...user,
          role: userData?.role, // Role alanını ekle
        },
        session,
      };
    }),
  ],
});

import { z } from "zod";

export const formSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters long" })
    .max(50, { message: "Name must be at most 50 characters long" }),

  email: z
    .string()
    .email({ message: "Invalid email address" })
    .min(2, { message: "Email must be at least 2 characters long" })
    .max(50, { message: "Email must be at most 50 characters long" }),

  password: z
    .string()
    .min(8, { message: "Password must be at least 6 characters long" })
    .max(50, { message: "Password must be at most 50 characters long" }),
});

//form schema for SignIn page
export const signInFormSchema = formSchema.pick({
  email: true,
  password: true,
});

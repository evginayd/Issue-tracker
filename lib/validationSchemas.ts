import { z } from "zod";

export const createIssueSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  assigneeId: z.string().optional(),
  dueDate: z.date().optional(),
  category: z.enum(["FRONTEND", "BACKEND", "DESIGN", "SUPPORT"]).optional(),
  labels: z.array(z.string()).optional(),
});

export type CreateIssue = z.infer<typeof createIssueSchema>;

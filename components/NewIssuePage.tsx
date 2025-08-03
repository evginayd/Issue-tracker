"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Link from "next/link";

type Session = {
  user: {
    role?: string;
    id: string;
    email: string;
    emailVerified: boolean;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    image?: string | null;
  };
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
    token: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  };
};

type User = {
  id: string;
  name?: string;
  email: string;
  role: "DEVELOPER" | "PROJECT_LEADER" | "MANAGER" | "TESTER";
};

type FormData = {
  title: string;
  description?: string;
  status: "OPEN" | "IN_PROGRESS" | "CLOSED";
  priority?: "LOW" | "MEDIUM" | "HIGH";
  category: "FRONTEND" | "BACKEND" | "DESIGN" | "SUPPORT";
  dueDate?: string;
  labels: string[];
  projectId: string;
  assignedById: string;
  assigneeId?: string | null;
};

type Props = {
  session: Session | null;
};

export default function NewIssuePage({ session }: Props) {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [assigneeRole, setAssigneeRole] = useState<
    "DEVELOPER" | "PROJECT_LEADER" | "MANAGER" | "TESTER" | ""
  >("");
  const [formData, setFormData] = useState<FormData>({
    labels: [],
    title: "",
    description: "",
    status: "OPEN",
    priority: "LOW",
    category: "DESIGN",
    projectId: projectId || "",
    assignedById: session?.user?.id || "",
  });
  const [project, setProject] = useState({
    name: "",
    description: "",
    members: [{ userId: "", role: "DEVELOPER" }],
  });

  useEffect(() => {
    console.log("Session in NewIssuePage:", JSON.stringify(session, null, 2));
    console.log("Project ID:", projectId);
    console.log("AssignedById:", formData.assignedById);
    console.log(
      "sessionStorage.codeSnippet:",
      sessionStorage.getItem("codeSnippet")
    );

    // Clear sessionStorage on mount to prevent stale data
    sessionStorage.removeItem("codeSnippet");

    if (!projectId) {
      toast.error(
        "No project selected. Please select a project to create an issue."
      );
      router.push("/home");
      return;
    }
    if (!session || !session.user?.id) {
      toast.error("Please sign in to create an issue");
      return;
    }

    // sessionStorage'dan kod snippet'ini al
    const savedCode = sessionStorage.getItem("codeSnippet");
    if (
      savedCode &&
      savedCode !== "// No code snippet available" &&
      !formData.description?.includes(savedCode)
    ) {
      setFormData((prev) => ({
        ...prev,
        description:
          (prev.description || "") + "\n```javascript\n" + savedCode + "\n```",
      }));
      sessionStorage.removeItem("codeSnippet"); // Tek kullanımlık, temizle
    }

    async function fetchUsers() {
      try {
        const res = await fetch(`/api/projects/${projectId}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error(await res.text());
        const project = await res.json();
        setProject(project);
        const memberIds = project.members.map(
          (m: { userId: string }) => m.userId
        );

        const usersRes = await fetch("/api/users", { credentials: "include" });
        if (!usersRes.ok) throw new Error(await usersRes.text());
        const usersData: User[] = await usersRes.json();
        setUsers(usersData.filter((u) => memberIds.includes(u.id)));
      } catch (error: unknown) {
        toast.error("Failed to fetch users: " + error);
      }
    }
    fetchUsers();
  }, [projectId, session]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === "labels") {
      setFormData((prev) => ({
        ...prev,
        labels: value
          .split(",")
          .map((label) => label.trim())
          .filter(Boolean),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (name: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value === "none" ? null : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !session || !session.user?.id) {
      toast.error("Project ID or session missing");
      return;
    }
    if (!formData.title) {
      toast.error("Title is required");
      return;
    }
    try {
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          assignedById: session.user.id,
        }),
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error("Failed to create issue: " + (data.error || data.message));
        return;
      }

      toast.success("Issue created successfully!");
      sessionStorage.removeItem("codeSnippet"); // Clear sessionStorage after successful submission
      router.push(`/issues?projectId=${projectId}`);
    } catch (error: unknown) {
      toast.error("Unexpected error: " + error);
    }
  };

  const filteredAssignees = assigneeRole
    ? users.filter((u) => u.role === assigneeRole)
    : users;

  if (!session || !session.user?.id) {
    return (
      <div className="max-w-3xl mx-auto mt-12 p-6 rounded-2xl shadow-md border border-gray-200 text-center text-gray-500">
        Please sign in to create an issue.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-12 p-6 rounded-2xl shadow-md border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          Create New Issue for {project.name}
        </h1>
        <div className="flex gap-2">
          <Button asChild variant="secondary">
            <Link href={`/issues?projectId=${projectId}`}>Cancel</Link>
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title + Priority */}
        <div className="flex gap-4">
          <div className="flex-1">
            <Label htmlFor="title" className="block font-medium mb-1">
              Title
            </Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter issue title"
              required
            />
          </div>

          <div className="w-1/3">
            <Label htmlFor="priority" className="block font-medium mb-1">
              Priority
            </Label>
            <Select
              value={formData.priority || ""}
              onValueChange={(value) => handleSelectChange("priority", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description" className="block font-medium mb-1">
            Description
          </Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description || ""}
            onChange={handleChange}
            placeholder="Enter issue description (Markdown supported)"
            className="min-h-[100px]"
          />
        </div>

        {/* Status + Category */}
        <div className="flex gap-4">
          <div className="flex-1">
            <Label htmlFor="status" className="block font-medium mb-1">
              Status
            </Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleSelectChange("status", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <Label htmlFor="category" className="block font-medium mb-1">
              Category
            </Label>
            <Select
              value={formData.category}
              onValueChange={(value) => handleSelectChange("category", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DESIGN">Design</SelectItem>
                <SelectItem value="FRONTEND">Frontend</SelectItem>
                <SelectItem value="BACKEND">Backend</SelectItem>
                <SelectItem value="SUPPORT">Support</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Due Date + Labels */}
        <div className="flex gap-4">
          <div className="flex-1">
            <Label htmlFor="dueDate" className="block font-medium mb-1">
              Due Date
            </Label>
            <Input
              id="dueDate"
              name="dueDate"
              type="date"
              value={formData.dueDate || ""}
              onChange={handleChange}
            />
          </div>

          <div className="flex-1">
            <Label htmlFor="labels" className="block font-medium mb-1">
              Labels
            </Label>
            <Input
              id="labels"
              name="labels"
              value={formData.labels.join(", ")}
              onChange={handleChange}
              placeholder="Enter labels (comma-separated)"
            />
          </div>
        </div>

        {/* Assignee Role + Assignee */}
        <div className="flex gap-4">
          <div className="flex-1">
            <Label htmlFor="assigneeRole" className="block font-medium mb-1">
              Assignee Role
            </Label>
            <Select
              value={assigneeRole}
              onValueChange={(value) =>
                setAssigneeRole(value as typeof assigneeRole)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DEVELOPER">Developer</SelectItem>
                <SelectItem value="TESTER">Tester</SelectItem>
                <SelectItem value="MANAGER">Manager</SelectItem>
                <SelectItem value="PROJECT_LEADER">Team Leader</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <Label htmlFor="assigneeId" className="block font-medium mb-1">
              Assignee
            </Label>
            <Select
              value={formData.assigneeId || ""}
              onValueChange={(value) => handleSelectChange("assigneeId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a user to assign" />
              </SelectTrigger>
              <SelectContent>
                {filteredAssignees.length > 0 ? (
                  filteredAssignees.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || user.email}
                    </SelectItem>
                  ))
                ) : (
                  <div className="text-gray-500 p-2 text-sm">
                    No users available for this role
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button type="submit">Create Issue</Button>
        </div>
      </form>
    </div>
  );
}

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
  role: "DEVELOPER" | "TEAM_LEADER" | "MANAGER" | "TESTER";
};

type FormData = {
  title: string;
  description?: string;
  status: "OPEN" | "IN_PROGRESS" | "CLOSED";
  priority?: "LOW" | "MEDIUM" | "HIGH";
  category: "DESIGN" | "DEVELOPMENT" | "TESTING" | "BUG";
  dueDate?: string;
  labels: string[];
  projectId: string;
  assignedById: string;
  assigneeId?: string;
};

type Props = {
  session: Session | null;
};

export default function NewIssuePage({ session }: Props) {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    status: "OPEN",
    priority: "MEDIUM",
    category: "DESIGN",
    dueDate: "",
    labels: [],
    projectId: projectId || "",
    assignedById: session?.user?.id || "", // Oturum açmış kullanıcının ID'si
    assigneeId: "",
  });

  useEffect(() => {
    console.log("Session in NewIssuePage:", JSON.stringify(session, null, 2));
    console.log("Project ID:", projectId);
    console.log("AssignedById:", formData.assignedById);

    if (!projectId) {
      toast.error("No project ID provided");
      return;
    }
    if (!session || !session.user?.id) {
      toast.error("Please sign in to create an issue");
      return;
    }

    async function fetchUsers() {
      try {
        const res = await fetch(`/api/projects/${projectId}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error(await res.text());
        const project = await res.json();
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
      [name]: value === "none" ? undefined : value,
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
          assignedById: session.user.id, // Güvenli olsun diye burada da set ediyorum
        }),
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error("Failed to create issue: " + (data.error || data.message));
        return;
      }

      toast.success("Issue created successfully!");
      router.push(`/issues?projectId=${projectId}`);
    } catch (error: unknown) {
      toast.error("Unexpected error: " + error);
    }
  };

  if (!projectId) {
    return toast.error("No project ID provided");
  }

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
        <h1 className="text-2xl font-bold">Create New Issue</h1>
        <div className="flex gap-2">
          <Button asChild variant="secondary">
            <Link href={`/issues?projectId=${projectId}`}>Cancel</Link>
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="mb-4">
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

        <div className="mb-4">
          <Label htmlFor="description" className="block font-medium mb-1">
            Description
          </Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description || ""}
            onChange={handleChange}
            placeholder="Enter issue description"
          />
        </div>

        <div className="mb-4">
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

        <div className="mb-4">
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

        <div className="mb-4">
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
              <SelectItem value="DEVELOPMENT">Development</SelectItem>
              <SelectItem value="TESTING">Testing</SelectItem>
              <SelectItem value="BUG">Bug</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mb-4">
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

        <div className="mb-4">
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

        <div className="mb-4">
          <Label htmlFor="assigneeId" className="block font-medium mb-1">
            Assignee
          </Label>
          <Select
            value={formData.assigneeId || "none"}
            onValueChange={(value) => handleSelectChange("assigneeId", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name || user.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 mt-4">
          <Button type="submit" className="flex items-center gap-2">
            Create Issue
          </Button>
        </div>
      </form>
    </div>
  );
}

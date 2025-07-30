"use client";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import CodeEditor from "@/components/CodeEditor";
import Link from "next/link";

type Status = "OPEN" | "IN_PROGRESS" | "CLOSED";
type Priority = "LOW" | "MEDIUM" | "HIGH";
type Category = "FRONTEND" | "BACKEND" | "DESIGN" | "SUPPORT";
type Role = "DEVELOPER" | "TESTER" | "PROJECT_LEADER" | "MANAGER";

type Session = {
  user: {
    role?: string;
    id: string;
    email: string;
    name: string;
    emailVerified?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    image?: string | null;
  };
};

type User = {
  id: string;
  name: string | null;
  email: string;
  role: Role;
};

type Issue = {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  category: Category;
  projectId: string;
  assignedById: string;
  codeSnippet: { id: string; content: string }[];
  assignedBy: User;
};

type Props = {
  session: Session | null;
  issue: Issue;
};

export default function EditIssue({ session, issue }: Props) {
  const [form, setForm] = useState<Issue>(issue);
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();
  const userRole = session?.user?.role?.toUpperCase();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (
      !form.title ||
      !form.description ||
      !form.status ||
      !form.priority ||
      !form.category
    ) {
      toast.error("All fields are required");
      return;
    }

    try {
      const res = await fetch(`/api/issues/${issue.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          status: form.status,
          priority: form.priority,
          category: form.category,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("Update issue error:", err);
        toast.error(
          `Update failed: ${err.error || err.message || "Unknown error"}`
        );
        return;
      }

      toast.success("Issue updated!");
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error("Update issue error:", error);
      toast.error(`Unexpected error: ${error}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-12 p-6 rounded-2xl shadow-md border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{issue.title}</h1>
        <div className="flex gap-2">
          {userRole === "MANAGER" && !isEditing && (
            <Button onClick={() => setIsEditing(true)}>Edit</Button>
          )}
          <Button asChild variant="secondary">
            <Link href={`/issues?projectId=${issue.projectId}`}>
              Back to Issues
            </Link>
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Title</h2>
          {isEditing ? (
            <Input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Enter issue title"
            />
          ) : (
            <p className="text-gray-700 dark:text-gray-300">{form.title}</p>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold">Description</h2>
          {isEditing ? (
            <Textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Issue description"
            />
          ) : (
            <p className="text-gray-700 dark:text-gray-300">
              {form.description || "No description"}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h2 className="text-lg font-semibold">Status</h2>
            {isEditing ? (
              <Select
                value={form.status}
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
            ) : (
              <p className="text-gray-700 dark:text-gray-300">{form.status}</p>
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold">Priority</h2>
            {isEditing ? (
              <Select
                value={form.priority}
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
            ) : (
              <p className="text-gray-700 dark:text-gray-300">
                {form.priority}
              </p>
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold">Category</h2>
            {isEditing ? (
              <Select
                value={form.category}
                onValueChange={(value) => handleSelectChange("category", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FRONTEND">Frontend</SelectItem>
                  <SelectItem value="BACKEND">Backend</SelectItem>
                  <SelectItem value="DESIGN">Design</SelectItem>
                  <SelectItem value="SUPPORT">Support</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <p className="text-gray-700 dark:text-gray-300">
                {form.category}
              </p>
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold">Assigned By</h2>
            <p className="text-gray-700 dark:text-gray-300">
              {form.assignedBy.name || form.assignedById}
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Code Snippet</h2>
          {form.codeSnippet.length > 0 ? (
            form.codeSnippet.map((snippet, index) => (
              <div key={snippet.id} className="mb-4">
                <h3 className="text-md font-medium">Snippet {index + 1}</h3>
                <CodeEditor
                  code={snippet.content || "// No code snippet available"}
                  session={session}
                  projectId={issue.projectId}
                  issueId={issue.id}
                  readOnly={true}
                />
              </div>
            ))
          ) : (
            <p className="text-gray-700 dark:text-gray-300">
              No code snippet available.
            </p>
          )}
        </div>
      </div>

      {isEditing && (
        <div className="flex gap-2 mt-4">
          <Button onClick={handleSubmit}>Save</Button>
          <Button variant="secondary" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}

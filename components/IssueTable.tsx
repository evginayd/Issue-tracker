"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

type Issue = {
  id: string;
  title: string;
  description?: string;
  status: "OPEN" | "IN_PROGRESS" | "CLOSED";
  priority?: "LOW" | "MEDIUM" | "HIGH";
  category: "DESIGN" | "DEVELOPMENT" | "TESTING" | "BUG";
  dueDate?: string;
  labels: string[];
  projectId: string;
  project: { id: string; name: string };
  assignedBy: { id: string; name: string };
  assignee?: { id: string; name: string };
  createdAt: string;
};

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

type Props = {
  session: Session | null;
};

export default function IssueTable({ session }: Props) {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const router = useRouter();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [projectName, setProjectName] = useState<string>("");

  useEffect(() => {
    console.log("Session in IssueTable:", JSON.stringify(session, null, 2));
    console.log("Project ID in IssueTable:", projectId);

    if (!projectId) {
      toast.error("No project ID provided");
      return;
    }

    async function fetchIssues() {
      try {
        const url = `/api/issues?projectId=${projectId}`;
        console.log("Fetching issues from:", url);
        const res = await fetch(url, { credentials: "include" });
        if (!res.ok) {
          const errorText = await res.text();
          console.error("Fetch issues error:", errorText);
          throw new Error(errorText);
        }
        const data: Issue[] = await res.json();
        console.log(
          "Fetched issues in IssueTable:",
          JSON.stringify(data, null, 2)
        );
        setIssues(data);
        setFilteredIssues(data);
        setProjectName(
          data.length > 0 ? data[0].project.name : "Unknown Project"
        );
      } catch (error: unknown) {
        console.error("Error in fetchIssues:", error);
        toast.error("Failed to fetch issues: " + error);
      }
    }
    fetchIssues();
  }, [projectId]);

  useEffect(() => {
    let result = issues;
    if (searchTerm) {
      result = result.filter((issue) =>
        issue.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (selectedCategory !== "ALL") {
      result = result.filter((issue) => issue.category === selectedCategory);
    }
    setFilteredIssues(result);
    console.log("Filtered issues:", JSON.stringify(result, null, 2));
  }, [searchTerm, selectedCategory, issues]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleNewIssueClick = () => {
    if (!session || !session.user?.id) {
      toast.error("Please sign in to create an issue");
      return;
    }
    if (!projectId) {
      toast.error("No project ID provided");
      return;
    }
    router.push(`/issues/new?projectId=${projectId}`);
  };

  const handleDeleteCodeSnippet = async (codeSnippetId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this code snippet?"
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/code-snippets/${codeSnippetId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(`Failed to delete code snippet: ${data.error}`);
        return;
      }

      toast.success("Code snippet deleted successfully");
      // Optionally refresh issues to reflect updated codeSnippetId
      const url = `/api/issues?projectId=${projectId}`;
      const resIssues = await fetch(url, { credentials: "include" });
      if (resIssues.ok) {
        const data: Issue[] = await resIssues.json();
        setIssues(data);
        setFilteredIssues(data);
      }
    } catch (error) {
      toast.error("Failed to delete code snippet");
    }
  };

  const handleDelete = async (issueId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this issue?"
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/issues/${issueId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.error === "Cannot delete issue with associated code snippet") {
          toast.error(
            `Cannot delete issue: Associated code snippet must be deleted first.`,
            {
              action: {
                label: "Delete Code Snippet",
                onClick: () => handleDeleteCodeSnippet(data.codeSnippetId),
              },
            }
          );
        } else {
          toast.error(`Failed to delete issue: ${data.error}`);
        }
        return;
      }

      toast.success("Issue deleted successfully");
      window.location.reload();
    } catch (error) {
      toast.error("Failed to delete issue");
    }
  };

  if (!projectId) {
    return (
      <div className="w-full p-6 max-w-5xl mx-auto text-center text-gray-500">
        No project selected. Please select a project to view its issues.
      </div>
    );
  }

  return (
    <div className="w-full p-4">
      <div className="flex items-center gap-4 mb-8 flex-wrap lg:flex-nowrap">
        <div className="relative w-full max-w-md">
          <Search className="absolute h-4 w-4 left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <Input
            placeholder="Search issues by title..."
            className="pl-10 bg-gray-50 dark:bg-gray-800"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        <div className="w-full max-w-xs">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="bg-gray-50 dark:bg-gray-800">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Categories</SelectItem>
              <SelectItem value="DESIGN">Design</SelectItem>
              <SelectItem value="BACKEND">Backend</SelectItem>
              <SelectItem value="FRONTEND">Frontend</SelectItem>
              <SelectItem value="SUPPORT">Support</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto">
          {session ? (
            <Button onClick={handleNewIssueClick}>Create Issue</Button>
          ) : (
            <Link href="/sign-in" className={buttonVariants()}>
              Sign In
            </Link>
          )}
        </div>
      </div>
      <div className="w-full max-w-7xl mx-auto">
        <div className="max-h-[550px] overflow-y-auto">
          <Table>
            <TableCaption>Issues for {projectName}</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Assigned By</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIssues.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-500">
                    No issues found for this project.
                  </TableCell>
                </TableRow>
              ) : (
                filteredIssues.map((issue, index) => (
                  <TableRow key={issue.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{issue.title}</TableCell>
                    <TableCell>{issue.status}</TableCell>
                    <TableCell>{issue.category}</TableCell>
                    <TableCell>{issue.priority || "Not set"}</TableCell>
                    <TableCell>
                      {issue.dueDate
                        ? new Date(issue.dueDate).toLocaleDateString()
                        : "Not set"}
                    </TableCell>
                    <TableCell>{issue.assignedBy.name}</TableCell>
                    <TableCell>
                      {issue.assignee?.name || "Not assigned"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end flex-wrap">
                        <Link
                          href={`/issues/${issue.id}?projectId=${issue.projectId}`}
                        >
                          <Button variant="secondary" size="sm">
                            View Issue
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/issues/code-editor?projectId=${projectId}&issueId=${issue.id}`
                            )
                          }
                        >
                          Edit Code
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(issue.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

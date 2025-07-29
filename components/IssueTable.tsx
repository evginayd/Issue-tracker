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
              <SelectItem value="DEVELOPMENT">Development</SelectItem>
              <SelectItem value="TESTING">Testing</SelectItem>
              <SelectItem value="BUG">Bug</SelectItem>
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
      <Table>
        <TableCaption>Issues for {projectName}</TableCaption>
        <TableHeader>
          <TableRow>
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
            filteredIssues.map((issue) => (
              <TableRow key={issue.id}>
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
                <TableCell>{issue.assignee?.name || "Not assigned"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-3">
                    <Link
                      href={`/issues/${issue.id}/edit`}
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </Link>
                    <button
                      className="text-red-600 hover:underline"
                      onClick={() => toast.error("Delete not implemented yet")}
                    >
                      Delete
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

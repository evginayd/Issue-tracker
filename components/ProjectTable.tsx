"use client";

import { useState, useEffect } from "react";
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
import { Search } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { newProject } from "@/lib/newProject";

type Project = {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  managerId: string;
  manager: { id: string; name: string };
  issues: { id: string }[];
  members: { user: { id: string; name: string } }[];
};

type Session = {
  id: string;
  role: string | undefined;
  email: string;
  emailVerified: boolean;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  image?: string | null;
};

export default function ProjectTable({ session }: { session: Session | null }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const userRole = session?.role?.toUpperCase();
  const userId = session?.id;

  useEffect(() => {
    async function fetchProjects() {
      if (!session) {
        toast.error("Please sign in to view projects");
        return;
      }

      try {
        const url =
          userRole === "MANAGER"
            ? "/api/projects?role=manager"
            : `/api/projects?userId=${userId}`;

        const res = await fetch(url, {
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error(await res.text());
        }

        const data: Project[] = await res.json();
        setProjects(data);
      } catch (error) {
        console.error("Fetch projects error:", error);
        toast.error("Failed to fetch projects");
      }
    }

    fetchProjects();
  }, [userRole, userId, session]);

  const handleNewProjectClick = async () => {
    const result = await newProject();
    if (result.error) {
      toast.error(result.error);
      return;
    }
    router.push("/dashboard");
  };

  const handleDeleteProject = async (projectId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this project? This action cannot be undone."
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.error === "Cannot delete project with existing issues") {
          toast.error(
            `Cannot delete project: Issues still exist: ${data.issueIds
              ?.map((issue: { id: string; title: string }) => issue.title)
              .join(", ")}`
          );
        } else if (data.error.includes("related records")) {
          toast.error(
            "Cannot delete project: Remove all related records first."
          );
        } else {
          toast.error(`Failed to delete project: ${data.error}`);
        }
        return;
      }
      toast.success("Project deleted successfully");
      window.location.reload();
    } catch (error) {
      toast.error("Failed to delete project");
    }
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  return (
    <div className="w-full p-4">
      <div className="flex items-center gap-4 mb-6 flex-wrap lg:flex-nowrap">
        <div className="relative w-full max-w-sm">
          <Search className="absolute h-4 w-4 left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search projects..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="ml-auto">
          {session ? (
            <Button onClick={handleNewProjectClick}>New Project</Button>
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
            <TableCaption>
              A list of your projects ({filteredProjects.length}{" "}
              {filteredProjects.length === 1 ? "project" : "projects"}).
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Issues</TableHead>
                {userRole === "MANAGER" && (
                  <TableHead className="text-right">Actions</TableHead>
                )}
                {userRole !== "MANAGER" && (
                  <TableHead className="text-right">View Details</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={userRole === "MANAGER" ? 9 : 8}
                    className="text-center"
                  >
                    No projects found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProjects.map((project, index) => (
                  <TableRow key={project.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">
                      {project.name}
                    </TableCell>
                    <TableCell>
                      {project.description || "No description"}
                    </TableCell>
                    <TableCell>
                      {new Date(project.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {new Date(project.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{project.manager?.name || "Unknown"}</TableCell>
                    <TableCell>{project.members.length}</TableCell>
                    <TableCell>{project.issues.length}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button className="text-right" asChild>
                          <Link href={`/projects/${project.id}`}>
                            View Details
                          </Link>
                        </Button>
                        {userRole === "MANAGER" && (
                          <Button
                            variant="ghost"
                            className="text-red-600"
                            onClick={() => handleDeleteProject(project.id)}
                          >
                            Delete
                          </Button>
                        )}
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

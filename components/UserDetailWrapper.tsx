"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type User = {
  id: string;
  name: string | null;
  email: string;
  role: "DEVELOPER" | "TESTER" | "PROJECT_LEADER" | "MANAGER";
  specialty: "BACKEND" | "FRONTEND" | "DESIGN" | "SUPPORT";
  Project: { id: string; name: string }[] | null;
};

type Props = {
  user: User;
  currentUserId: string;
  currentUserRole: "DEVELOPER" | "TESTER" | "PROJECT_LEADER" | "MANAGER";
  onRoleChange: (newRole: string) => Promise<void>;
};

const UserDetailPage = ({ currentUserId }: Props) => {
  const { userId } = useParams();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/users/${userId}`, {
          credentials: "include",
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to fetch user");
        }
        const data = await res.json();
        setUser(data);
        setSelectedRole(data.role);
        setSelectedSpecialty(data.specialty);
      } catch (err) {
        console.error("Error fetching user:", err);
        toast.error(`Failed to load user: ${err}`);
      }
    };
    fetchUser();
  }, [userId]);

  const handleRoleChange = async (newRole: string) => {
    setSelectedRole(newRole);
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
        credentials: "include",
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update role");
      }
      setUser((prev) =>
        prev ? { ...prev, role: newRole as User["role"] } : null
      );
      toast.success("Role updated successfully!");
    } catch (error) {
      console.error("Error updating role:", error);
      setSelectedRole(user?.role || "");
      toast.error(`Failed to update role: ${error}`);
    }
  };

  const handleSpecialtyChange = async (newSpecialty: string) => {
    setSelectedSpecialty(newSpecialty);
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ specialty: newSpecialty }),
        credentials: "include",
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update specialty");
      }
      setUser((prev) =>
        prev ? { ...prev, specialty: newSpecialty as User["specialty"] } : null
      );
      toast.success("Specialty updated successfully!");
    } catch (error) {
      console.error("Error updating specialty:", error);
      setSelectedSpecialty(user?.specialty || "");
      toast.error(`Failed to update specialty: ${error}`);
    }
  };

  const handleDeleteUser = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this user? This action cannot be undone."
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const data = await response.json();
        if (data.error === "Cannot delete user with assigned issues") {
          toast.error(
            `Cannot delete user: Assigned issues exist: ${data.issues
              .map((issue: { id: string; title: string }) => issue.title)
              .join(", ")}`,
            {
              action: {
                label: "View Issues",
                onClick: () =>
                  router.push(
                    `/issues?projectId=${user?.Project?.[0]?.id || ""}`
                  ),
              },
            }
          );
        } else if (
          data.error === "Cannot delete user with associated code snippets"
        ) {
          toast.error(
            `Cannot delete user: Associated code snippets exist: ${data.codeSnippets
              .map((snippet: { id: string }) => snippet.id)
              .join(", ")}`,
            {
              action: {
                label: "Delete Code Snippets",
                onClick: async () => {
                  for (const snippet of data.codeSnippets) {
                    const res = await fetch(
                      `/api/code_snippets/${snippet.id}`,
                      {
                        method: "DELETE",
                        credentials: "include",
                      }
                    );
                    if (!res.ok) {
                      const errorData = await res.json();
                      toast.error(
                        `Failed to delete code snippet ${snippet.id}: ${errorData.error}`
                      );
                    }
                  }
                  toast.success(
                    "Code snippets deleted, try deleting user again."
                  );
                },
              },
            }
          );
        } else if (data.error === "Cannot delete user managing projects") {
          toast.error(
            `Cannot delete user: Managing projects: ${data.projects
              .map((project: { id: string; name: string }) => project.name)
              .join(", ")}`,
            {
              action: {
                label: "View Projects",
                onClick: () => router.push("/projects"),
              },
            }
          );
        } else {
          toast.error(`Failed to delete user: ${data.error}`);
        }
        return;
      }
      toast.success("User deleted successfully!");
      setUser(null);
      setTimeout(() => {
        router.push("/users");
      }, 1000);
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error(`Failed to delete user: ${error}`);
    }
  };

  if (!user)
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );

  const isSelf = user.id === currentUserId;

  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-lg mx-auto shadow-lg border border-gray-200 rounded-xl">
        <CardHeader className="rounded-t-xl p-6">
          <CardTitle className="text-2xl font-bold flex items-center">
            {user.name || "Unnamed User"}
            <Button
              variant="destructive"
              className="ml-auto"
              onClick={handleDeleteUser}
              disabled={isSelf}
            >
              Delete User
            </Button>
          </CardTitle>
          <CardDescription>{user.email}</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-neutral-300">
              <span className="font-semibold">User ID:</span>
              <span>{user.id}</span>
            </div>
            <Separator />
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Role</h3>
              <div className="flex items-center gap-4">
                <Select
                  value={selectedRole}
                  onValueChange={handleRoleChange}
                  disabled={isSelf}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DEVELOPER">Developer</SelectItem>
                    <SelectItem value="TESTER">Tester</SelectItem>
                    <SelectItem value="PROJECT_LEADER">
                      Project Leader
                    </SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                  </SelectContent>
                </Select>
                <Badge
                  variant="secondary"
                  className={
                    user.role === "MANAGER"
                      ? "bg-red-100 text-red-800"
                      : user.role === "PROJECT_LEADER"
                      ? "bg-yellow-100 text-yellow-800"
                      : user.role === "TESTER"
                      ? "bg-green-100 text-green-800"
                      : "bg-blue-100 text-blue-800"
                  }
                >
                  {user.role}
                </Badge>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                Specialty
              </h3>
              <div className="flex items-center gap-4">
                <Select
                  value={selectedSpecialty}
                  onValueChange={handleSpecialtyChange}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BACKEND">Backend</SelectItem>
                    <SelectItem value="FRONTEND">Frontend</SelectItem>
                    <SelectItem value="DESIGN">Design</SelectItem>
                    <SelectItem value="SUPPORT">Support</SelectItem>
                  </SelectContent>
                </Select>
                <Badge
                  variant="secondary"
                  className={
                    user.specialty === "BACKEND"
                      ? "bg-red-100 text-red-800"
                      : user.specialty === "FRONTEND"
                      ? "bg-yellow-100 text-yellow-800"
                      : user.specialty === "DESIGN"
                      ? "bg-green-100 text-green-800"
                      : "bg-blue-100 text-blue-800"
                  }
                >
                  {user.specialty}
                </Badge>
              </div>
            </div>
            <Separator />
            <div>
              <h3 className="text-sm font-medium text-gray-500">Projects</h3>
              {user.Project && user.Project.length > 0 ? (
                <ul className="mt-2 space-y-2">
                  {user.Project.map((project) => (
                    <li
                      key={project.id}
                      className="py-2 px-3 bg-gray-50 rounded-md text-gray-900 hover:bg-gray-100 transition"
                    >
                      {project.name}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 italic">No projects assigned</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserDetailPage;

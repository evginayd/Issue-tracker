"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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

type User = {
  id: string;
  name: string | null;
  email: string;
  role: "DEVELOPER" | "TESTER" | "PROJECT_LEADER" | "MANAGER";
  specialty: "BACKEND" | "FRONTEND";
  Project: { id: string; name: string }[] | null;
};

type Props = {
  user: User;
  currentUserRole: string;
  onRoleChange: (newRole: string) => Promise<void>;
  currentUserId: string; // sunucudan gelen giriş yapan kullanıcının ID'si
};

const UserDetailPage = ({ currentUserId }: Props) => {
  const { userId } = useParams();
  const [user, setUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setUser(data);
        setSelectedRole(data.role);
      })
      .catch((err) => console.error("Error fetching user:", err));
  }, [userId]);

  const handleRoleChange = async (newRole: string) => {
    setSelectedRole(newRole);
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (response.ok) {
        setUser((prev) =>
          prev ? { ...prev, role: newRole as User["role"] } : null
        );
        toast.success("Role updated successfully!");
      } else {
        throw new Error("Failed to update role");
      }
    } catch (error) {
      console.error("Error updating role:", error);
      setSelectedRole(user?.role || "");
      toast.error("Failed to update role");
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
          <CardTitle className="text-2xl font-bold">
            {user.name || "Unnamed User"}
          </CardTitle>
          <CardDescription>{user.email}</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* USER ID */}
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

            {/* SPECIALTY */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-neutral-300">
              <span className="font-semibold">Specialty:</span>
              <span>{user.specialty}</span>
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

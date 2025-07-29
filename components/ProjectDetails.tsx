"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

type Member = {
  userId: string;
  role: "DEVELOPER" | "TESTER" | "MANAGER" | "TEAM_LEADER";
};

type Project = {
  id: string;
  name: string;
  description: string;
  members: Member[];
};

type Props = {
  project: Project;
  session: Session | null;
};

export default function ProjectDetails({ project, session }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState<Project>(project);
  const [isEditing, setIsEditing] = useState(false);

  const userRole = session?.user?.role?.toUpperCase();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/users");
        if (!res.ok) throw new Error(await res.text());
        const data: User[] = await res.json();
        setUsers(data);
      } catch (error: unknown) {
        toast.error("Failed to fetch users: " + error);
      }
    };
    fetchUsers();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleMemberChange = (
    index: number,
    field: keyof Member,
    value: string
  ) => {
    const updated = [...form.members];
    updated[index][field] = value as Member["role"];
    setForm((prev) => ({ ...prev, members: updated }));
  };

  const addMember = () => {
    setForm((prev) => ({
      ...prev,
      members: [...prev.members, { userId: "", role: "DEVELOPER" }],
    }));
  };

  const removeMember = (index: number) => {
    const updated = [...form.members];
    updated.splice(index, 1);
    setForm((prev) => ({ ...prev, members: updated }));
  };

  const handleSubmit = async () => {
    try {
      const res = await fetch(`/api/projects/${form.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error("Failed: " + (data.error || data.message));
        return;
      }

      toast.success("Project updated successfully!");
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      toast.error("Unexpected error occurred.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-12 p-6 rounded-2xl shadow-md border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Project Details</h1>
        <div className="flex gap-2">
          {userRole === "MANAGER" && !isEditing && (
            <Button onClick={() => setIsEditing(true)}>Edit</Button>
          )}
          <Button asChild>
            <Link href={`/issues?projectId=${project.id}`}>View Issues</Link>
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <label className="block font-medium mb-1">Project Name</label>
        <Input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Enter project name"
          disabled={!isEditing}
        />
      </div>

      <div className="mb-4">
        <label className="block font-medium mb-1">Description</label>
        <Textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Project description"
          disabled={!isEditing}
        />
      </div>

      <div className="mb-4">
        <label className="block font-medium mb-2">Team Members</label>
        {form.members.map((member, index) => {
          const filteredUsers = users.filter((u) => u.role === member.role);

          return (
            <div key={index} className="flex gap-4 mb-2 items-center">
              <Select
                value={member.role}
                onValueChange={(value) =>
                  handleMemberChange(index, "role", value)
                }
                disabled={!isEditing}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DEVELOPER">Developer</SelectItem>
                  <SelectItem value="TESTER">Tester</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="TEAM_LEADER">Team Leader</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={member.userId}
                onValueChange={(value) =>
                  handleMemberChange(index, "userId", value)
                }
                disabled={!isEditing}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
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

              {form.members.length > 1 && isEditing && (
                <button
                  onClick={() => removeMember(index)}
                  className="text-red-600 font-bold px-2"
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}

        {isEditing && (
          <button
            onClick={addMember}
            className="mt-2 text-sm text-blue-600 hover:underline"
          >
            + Add Member
          </button>
        )}
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

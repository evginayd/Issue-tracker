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

export default function Home() {
  const [users, setUsers] = useState<User[]>([]);
  const [project, setProject] = useState({
    name: "",
    description: "",
    members: [{ userId: "", role: "DEVELOPER" }],
  });

  useEffect(() => {
    const fetchUsers = async () => {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(data);
    };
    fetchUsers();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setProject((prev) => ({ ...prev, [name]: value }));
  };

  const handleMemberChange = (
    index: number,
    field: keyof Member,
    value: string
  ) => {
    const updated = [...project.members];
    updated[index][field] = value;
    // Eğer rol değiştiyse userId'yi sıfırla
    if (field === "role") {
      updated[index].userId = "";
    }
    setProject((prev) => ({ ...prev, members: updated }));
  };

  const addMember = () => {
    setProject((prev) => ({
      ...prev,
      members: [...prev.members, { userId: "", role: "DEVELOPER" }],
    }));
  };

  const removeMember = (index: number) => {
    const updated = [...project.members];
    updated.splice(index, 1);
    setProject((prev) => ({ ...prev, members: updated }));
  };

  const getFilteredUsers = (role: string) => {
    if (role === "DEVELOPER")
      return users.filter((u) => u.role === "DEVELOPER");
    if (role === "MANAGER") return users.filter((u) => u.role === "MANAGER");
    if (role === "TESTER") return users.filter((u) => u.role === "TESTER"); // örnek eşleşme
    if (role === "TEAM_LEADER")
      return users.filter((u) => u.role === "TEAM_LEADER");
    return [];
  };

  const handleSubmit = async () => {
    try {
      const cleanedMembers = project.members.map((m) => ({
        ...m,
        role: m.role || "DEVELOPER",
      }));

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...project, members: cleanedMembers }),
      });

      if (res.ok) {
        toast.success("Project created successfully!");
        setProject({
          name: "",
          description: "",
          members: [{ userId: "", role: "DEVELOPER" }],
        });
      } else {
        const data = await res.json();
        toast.error("Failed: " + (data.error || data.message));
      }
    } catch (err) {
      console.error(err);
      toast.error("Unexpected error occurred.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-12 p-6 rounded-2xl shadow-md border border-gray-200">
      <h1 className="text-2xl font-bold mb-6">Create a New Project</h1>

      <div className="mb-4">
        <label className="block font-medium mb-1">Project Name</label>
        <input
          type="text"
          name="name"
          value={project.name}
          onChange={handleChange}
          className="w-full px-4 py-2 border rounded-md"
          placeholder="Enter project name"
          required
        />
      </div>

      <div className="mb-4">
        <label className="block font-medium mb-1">Description</label>
        <textarea
          name="description"
          value={project.description}
          onChange={handleChange}
          className="w-full px-4 py-2 border rounded-md"
          rows={3}
          placeholder="Project description (optional)"
        />
      </div>

      <div className="mb-4">
        <label className="block font-medium mb-2">Team Members</label>
        {project.members.map((member, index) => {
          const filteredUsers = getFilteredUsers(member.role);

          return (
            <div key={index} className="flex gap-4 mb-2 items-center">
              {/* Role seçimi */}
              <Select
                value={member.role}
                onValueChange={(value) =>
                  handleMemberChange(index, "role", value)
                }
                aria-label="Select member role"
              >
                <SelectTrigger className="w-[180px] rounded-md border-gray-300 focus:ring-2 focus:ring-blue-500">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DEVELOPER">Developer</SelectItem>
                  <SelectItem value="TESTER">Tester</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="TEAM_LEADER">Team Leader</SelectItem>
                </SelectContent>
              </Select>

              {/* User seçimi */}
              <Select
                value={member.userId}
                onValueChange={(value) =>
                  handleMemberChange(index, "userId", value)
                }
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
                      No users available
                    </div>
                  )}
                </SelectContent>
              </Select>

              {project.members.length > 1 && (
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

        <button
          onClick={addMember}
          className="mt-2 text-sm text-blue-600 hover:underline"
        >
          + Add Member
        </button>
      </div>

      <Button onClick={handleSubmit}>Create Project</Button>
    </div>
  );
}

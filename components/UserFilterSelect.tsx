"use client";

import { useEffect, useState } from "react";

type User = {
  id: string;
  name: string;
  role: string; // frontend/backend gibi
};

type Props = {
  onUserSelect: (userId: string) => void;
};

export default function UserFilterSelect({ onUserSelect }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [role, setRole] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<string>("");

  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => setUsers(data));
  }, []);

  const filteredUsers =
    role === "all"
      ? users
      : users.filter((user) => user.role.toLowerCase() === role.toLowerCase());

  return (
    <div className="flex gap-4">
      {/* Filter */}
      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        className="border px-3 py-1 rounded"
      >
        <option value="all">All</option>
        <option value="frontend">Frontend</option>
        <option value="backend">Backend</option>
      </select>

      {/* User List */}
      <select
        value={selectedUser}
        onChange={(e) => {
          setSelectedUser(e.target.value);
          onUserSelect(e.target.value);
        }}
        className="border px-3 py-1 rounded"
      >
        <option value="">Select a member</option>
        {filteredUsers.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name}
          </option>
        ))}
      </select>
    </div>
  );
}

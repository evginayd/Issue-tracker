"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  name: string | null;
  role: "DEVELOPER" | "TESTER" | "PROJECT_LEADER" | "MANAGER";
};

const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => setUsers(data))
      .catch((err) => console.error("Error fetching users:", err));
  }, []);

  const roles = ["DEVELOPER", "TESTER", "PROJECT_LEADER", "MANAGER"];

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Users</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {roles.map((role) => (
          <div key={role} className="p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">{role}</h2>
            <ul>
              {users
                .filter((user) => user.role === role)
                .map((user) => (
                  <div key={user.id} className="py-1">
                    <li
                      className="cursor-pointer hover:bg-gray-100 p-2 rounded"
                      onClick={() => router.push(`/users/${user.id}`)}
                    >
                      {user.name || "Unnamed User"}
                    </li>
                  </div>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UsersPage;

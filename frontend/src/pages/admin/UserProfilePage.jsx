import React from "react";
import { useAuthStore } from "@/stores/useAuthStore";

const UserProfilePage = () => {
  const authUser = useAuthStore((state) => state.authUser);

  return (
    <div className="rounded-xl border p-4">
      <h2 className="text-lg font-semibold">Profile</h2>
      <div className="mt-4 space-y-2 text-sm">
        <p><span className="font-medium">Name:</span> {authUser?.name || "-"}</p>
        <p><span className="font-medium">Email:</span> {authUser?.email || "-"}</p>
        <p><span className="font-medium">Phone:</span> {authUser?.phone || "-"}</p>
        <p><span className="font-medium">Role:</span> {authUser?.role || "-"}</p>
      </div>
    </div>
  );
};

export default UserProfilePage;

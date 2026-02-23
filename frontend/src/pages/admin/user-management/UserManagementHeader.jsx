import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const UserManagementHeader = ({ onCreateClick }) => (
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-2xl font-semibold">User Management</h1>
      <p className="text-sm text-muted-foreground">
        Manage user accounts, roles, and access.
      </p>
    </div>
    <Button onClick={onCreateClick}>
      <Plus className="mr-2 size-4" /> Add User
    </Button>
  </div>
);
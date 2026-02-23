import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";

export const UserTable = ({
  users,
  isLoading,
  selectedUserIds,
  onRowClick,
  onToggleSelect,
  onSelectAll,
}) => (
  <div className="overflow-x-auto">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <Checkbox
              checked={selectedUserIds.size === users.length && users.length > 0}
              onCheckedChange={onSelectAll}
            />
          </TableHead>
          <TableHead>User</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Subscription</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell colSpan={6}>
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            </TableCell>
          </TableRow>
        ) : users.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6}>
              <div className="flex flex-col items-center justify-center py-10 text-center text-sm text-muted-foreground">
                No users found.
              </div>
            </TableCell>
          </TableRow>
        ) : (
          users.map((user) => (
            <TableRow key={user._id} className="hover:bg-muted/40">
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedUserIds.has(user._id)}
                  onCheckedChange={() => onToggleSelect(user._id)}
                />
              </TableCell>
              <TableCell className="cursor-pointer" onClick={() => onRowClick(user)}>
                <div className="flex items-center gap-3">
                  <Avatar className="size-9">
                    <AvatarImage src={user.avatar || ""} alt={user.fullName} />
                    <AvatarFallback>
                      {(user.fullName || user.email || "U")[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user.fullName || "Unnamed"}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="cursor-pointer" onClick={() => onRowClick(user)}>
                <Badge variant={user.role === "admin" ? "" : "outline"}>
                  {user.role}
                </Badge>
              </TableCell>
              <TableCell className="cursor-pointer" onClick={() => onRowClick(user)}>
                {user.phone || "-"}
              </TableCell>
              <TableCell className="cursor-pointer" onClick={() => onRowClick(user)}>
                {user.subscriptionId || "-"}
              </TableCell>
              <TableCell className="cursor-pointer" onClick={() => onRowClick(user)}>
                {user.isBlocked ? (
                  <Badge variant="destructive">Blocked</Badge>
                ) : (
                  <Badge variant="secondary">Active</Badge>
                )}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
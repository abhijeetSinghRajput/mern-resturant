import { useEffect, useMemo, useState } from "react";
import { useAdminUserStore } from "@/stores/admin/adminUserStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const DEFAULT_PAGE_SIZE = 10;

const emptyForm = {
  fullName: "",
  email: "",
  role: "user",
  phone: "",
  avatar: "",
  isBlocked: false,
};

const UserManagementPage = () => {
  const {
    users,
    pagination,
    loading,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    changePassword,
    uploadAvatar,
    bulkAction,
  } = useAdminUserStore();

  const [page, setPage] = useState(1);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formState, setFormState] = useState(emptyForm);
  const [avatarFile, setAvatarFile] = useState(null);
  const [password, setPassword] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState(new Set());
  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState("");

  useEffect(() => {
    fetchUsers(page, DEFAULT_PAGE_SIZE);
  }, [fetchUsers, page]);

  useEffect(() => {
    if (!selectedUser) {
      return;
    }

    setFormState({
      fullName: selectedUser.fullName || "",
      email: selectedUser.email || "",
      role: selectedUser.role || "user",
      phone: selectedUser.phone || "",
      avatar: selectedUser.avatar || "",
      isBlocked: Boolean(selectedUser.isBlocked),
    });
    setAvatarFile(null);
  }, [selectedUser]);

  const totalPages = useMemo(
    () => pagination.totalPages || 1,
    [pagination.totalPages]
  );

  const handleRowClick = (user) => {
    setSelectedUser(user);
    setIsCreateMode(false);
    setPassword("");
    setSheetOpen(true);
  };

  const handleCreateClick = () => {
    setIsCreateMode(true);
    setSelectedUser(null);
    setFormState(emptyForm);
    setAvatarFile(null);
    setPassword("");
    setSheetOpen(true);
  };

  const handleInputChange = (field) => (event) => {
    const value = event?.target ? event.target.value : event;
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (isCreateMode) {
      if (!password || password.length < 8) {
        toast.error("Password must be at least 8 characters");
        return;
      }

      if (!formState.fullName || !formState.email) {
        toast.error("Full name and email are required");
        return;
      }

      try {
        const createdUser = await createUser({
          fullName: formState.fullName,
          email: formState.email,
          role: formState.role,
          phone: formState.phone,
          isBlocked: formState.isBlocked,
          password,
        });

        if (avatarFile && createdUser?._id) {
          await uploadAvatar(createdUser._id, avatarFile);
        }

        setPage(1);
        setSheetOpen(false);
        setFormState(emptyForm);
        setPassword("");
      } catch (error) {
        console.error("Create user error:", error);
      }
      return;
    }

    if (!selectedUser?._id) {
      return;
    }

    const updatedUser = await updateUser(selectedUser._id, {
      fullName: formState.fullName,
      email: formState.email,
      role: formState.role,
      phone: formState.phone,
      isBlocked: formState.isBlocked,
    });

    let nextUser = updatedUser;

    if (avatarFile) {
      const avatarUser = await uploadAvatar(selectedUser._id, avatarFile);
      if (avatarUser) {
        nextUser = avatarUser;
      }
    }

    setSelectedUser(nextUser);
    setSheetOpen(false);
  };

  const handlePasswordChange = async () => {
    if (!selectedUser?._id) {
      return;
    }

    if (!password || password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    await changePassword(selectedUser._id, password);
    setPassword("");
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser?._id) {
      return;
    }

    await deleteUser(selectedUser._id);
    setDeleteDialogOpen(false);
    setSheetOpen(false);
  };

  const handleToggleSelectUser = (userId) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedUserIds.size === users.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(users.map((u) => u._id)));
    }
  };

  const handleBulkAction = async (action) => {
    setBulkActionType(action);
    setBulkActionDialogOpen(true);
  };

  const handleBulkActionConfirm = async () => {
    if (selectedUserIds.size === 0) {
      toast.error("Please select at least one user");
      return;
    }

    try {
      await bulkAction(Array.from(selectedUserIds), bulkActionType);
      setSelectedUserIds(new Set());
      setBulkActionDialogOpen(false);
      setBulkActionType("");
    } catch (error) {
      console.error("Bulk action error:", error);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">User Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage user accounts, roles, and access.
          </p>
        </div>
        <Button onClick={handleCreateClick}>
          <Plus className="mr-2 size-4" /> Add User
        </Button>
      </div>

      {selectedUserIds.size > 0 && (
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">{selectedUserIds.size} user(s) selected</p>
              <p className="text-xs text-muted-foreground">Choose an action to perform on selected users</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction("BLOCK")}
                disabled={loading.bulkAction}
              >
                Block
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction("UNBLOCK")}
                disabled={loading.bulkAction}
              >
                Unblock
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction("MAKE_ADMIN")}
                disabled={loading.bulkAction}
              >
                Make Admin
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction("MAKE_USER")}
                disabled={loading.bulkAction}
              >
                Make User
              </Button>
              <Button
                size="icon"
                variant="destructive"
                onClick={() => handleBulkAction("DELETE")}
                disabled={loading.bulkAction}
                className="size-8"
              >
                <Trash2/> 
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedUserIds(new Set())}
                disabled={loading.bulkAction}
              >
                Clear
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedUserIds.size === users.length && users.length > 0}
                    onCheckedChange={handleSelectAll}
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
              {loading.users ? (
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
                  <TableRow
                    key={user._id}
                    className="hover:bg-muted/40"
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedUserIds.has(user._id)}
                        onCheckedChange={() => handleToggleSelectUser(user._id)}
                      />
                    </TableCell>
                    <TableCell
                      className="cursor-pointer"
                      onClick={() => handleRowClick(user)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9">
                          <AvatarImage src={user.avatar || ""} alt={user.fullName} />
                          <AvatarFallback>
                            {(user.fullName || user.email || "U")[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {user.fullName || "Unnamed"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell
                      className="cursor-pointer"
                      onClick={() => handleRowClick(user)}
                    >
                      <Badge variant={user.role === "admin" ? "" : "outline"}>{user.role}</Badge>
                    </TableCell>
                    <TableCell
                      className="cursor-pointer"
                      onClick={() => handleRowClick(user)}
                    >
                      {user.phone || "-"}
                    </TableCell>
                    <TableCell
                      className="cursor-pointer"
                      onClick={() => handleRowClick(user)}
                    >
                      {user.subscriptionId || "-"}
                    </TableCell>
                    <TableCell
                      className="cursor-pointer"
                      onClick={() => handleRowClick(user)}
                    >
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

        <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
          <span>
            Page {pagination.currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={!pagination.hasPreviousPage}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={!pagination.hasNextPage}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full max-w-xl">
          <SheetHeader>
            <SheetTitle>
              {isCreateMode ? "Create User" : "Update User"}
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6">
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="general">General</TabsTrigger>
                {!isCreateMode && <TabsTrigger value="danger">Danger</TabsTrigger>}
              </TabsList>

              <TabsContent value="general" className="space-y-6 pt-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-medium uppercase text-muted-foreground">
                      Full Name
                    </label>
                    <Input
                      value={formState.fullName}
                      onChange={handleInputChange("fullName")}
                      placeholder="Full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium uppercase text-muted-foreground">
                      Email
                    </label>
                    <Input
                      value={formState.email}
                      onChange={handleInputChange("email")}
                      placeholder="email@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-medium uppercase text-muted-foreground">
                      Role
                    </label>
                    <Select
                      value={formState.role}
                      onValueChange={handleInputChange("role")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium uppercase text-muted-foreground">
                      Phone
                    </label>
                    <Input
                      value={formState.phone}
                      onChange={handleInputChange("phone")}
                      placeholder="Phone"
                    />
                  </div>
                </div>

                <div className="rounded-lg border p-4 space-y-3">
                  <p className="text-sm font-medium">Profile Photo</p>
                  <div className="flex items-center gap-4">
                    <Avatar className="size-14">
                      <AvatarImage src={formState.avatar || ""} alt={formState.fullName} />
                      <AvatarFallback>
                        {(formState.fullName || formState.email || "U")[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(event) =>
                          setAvatarFile(event.target.files?.[0] || null)
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Upload to replace the current avatar.
                      </p>
                    </div>
                  </div>
                </div>

                {isCreateMode && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium uppercase text-muted-foreground">
                      Password
                    </label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Minimum 8 characters"
                    />
                  </div>
                )}
              </TabsContent>

              {!isCreateMode && (
                <TabsContent value="danger" className="space-y-6 pt-6">
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">Blocked</p>
                      <p className="text-xs text-muted-foreground">
                        Temporarily disable user access.
                      </p>
                    </div>
                    <Switch
                      checked={formState.isBlocked}
                      onCheckedChange={(value) =>
                        setFormState((prev) => ({
                          ...prev,
                          isBlocked: Boolean(value),
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-semibold">Change Password</p>
                    <Input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="New password (minimum 8 characters)"
                    />
                    <Button
                      variant="outline"
                      onClick={handlePasswordChange}
                      disabled={loading.changePassword}
                    >
                      {loading.changePassword ? "Updating..." : "Change Password"}
                    </Button>
                  </div>

                  <Button
                    variant="destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                    disabled={loading.deleteUser}
                  >
                    <Trash2 className="mr-2 size-4" /> Delete User
                  </Button>
                </TabsContent>
              )}
            </Tabs>

            <div className="mt-6 flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setSheetOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={loading.updateUser || loading.createUser}
              >
                {isCreateMode
                  ? loading.createUser
                    ? "Creating..."
                    : "Create User"
                  : loading.updateUser
                    ? "Saving..."
                    : "Save Changes"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this user?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The user will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading.deleteUser}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={loading.deleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading.deleteUser ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkActionDialogOpen} onOpenChange={setBulkActionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {bulkActionType === "DELETE"
                ? "Delete users?"
                : `${bulkActionType?.replace(/_/g, " ")} ${selectedUserIds.size} user(s)?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {bulkActionType === "DELETE" ? (
                <div className="space-y-2">
                  <p>
                    This action cannot be undone. You are about to permanently delete{" "}
                    <span className="font-semibold text-destructive">{selectedUserIds.size}</span>{" "}
                    {selectedUserIds.size === 1 ? "user" : "users"}.
                  </p>
                  <p>Are you sure?</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p>
                    You are about to{" "}
                    <span className="font-semibold">{bulkActionType?.replace(/_/g, " ").toLowerCase()}</span>{" "}
                    <span className="font-semibold text-primary">{selectedUserIds.size}</span>{" "}
                    {selectedUserIds.size === 1 ? "user" : "users"}.
                  </p>
                  <p>Please confirm this action.</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading.bulkAction}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkActionConfirm}
              disabled={loading.bulkAction}
              className={
                bulkActionType === "DELETE"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
            >
              {loading.bulkAction ? "Processing..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserManagementPage;

import { useEffect, useMemo, useState } from "react";
import { useAdminUserStore } from "@/stores/admin/adminUserStore";
import { toast } from "sonner";

import { UserManagementHeader } from "./UserManagementHeader";
import { UserFilters } from "./UserFilters";
import { BulkActionBar } from "./BulkActionBar";
import { UserTable } from "./UserTable";
import { UserPagination } from "./UserPagination";
import { UserSheet } from "./UserSheet";
import { DeleteUserDialog } from "./DeleteUserDialog";
import { BulkActionDialog } from "./BulkActionDialog";
import { useEmailAvailability } from "@/hooks/useEmailAvailability";
import { useDebouncedSearch } from "@/hooks/useDebouncedSearch";

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
    checkEmailAvailability,
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
  const [accountStatusFilter, setAccountStatusFilter] = useState("all");
  const [userTypeFilter, setUserTypeFilter] = useState("all");

  const { searchTerm, setSearchTerm, debouncedSearchTerm } = useDebouncedSearch();

  const emailAvailability = useEmailAvailability(
    formState.email,
    isCreateMode,
    checkEmailAvailability
  );

  useEffect(() => {
    fetchUsers(page, DEFAULT_PAGE_SIZE, debouncedSearchTerm, accountStatusFilter, userTypeFilter);
  }, [fetchUsers, page, debouncedSearchTerm, accountStatusFilter, userTypeFilter]);

  useEffect(() => {
    if (!selectedUser) return;
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

  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm, accountStatusFilter, userTypeFilter]);

  useEffect(() => {
    setSelectedUserIds((prev) => {
      const userIdSet = new Set(users.map((u) => u._id));
      return new Set([...prev].filter((id) => userIdSet.has(id)));
    });
  }, [users]);

  const totalPages = useMemo(() => pagination.totalPages || 1, [pagination.totalPages]);

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
      if (!formState.fullName || !formState.email) {
        toast.error("Full name and email are required");
        return;
      }
      if (!password || password.length < 8) {
        toast.error("Password must be at least 8 characters");
        return;
      }
      if (emailAvailability.status === "checking") {
        toast.error("Please wait for email availability check");
        return;
      }
      if (emailAvailability.status === "unavailable") {
        toast.error("Email is already in use");
        return;
      }
      if (emailAvailability.status === "invalid") {
        toast.error("Please enter a valid email address");
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

    if (!selectedUser?._id) return;

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
      if (avatarUser) nextUser = avatarUser;
    }

    setSelectedUser(nextUser);
    setSheetOpen(false);
  };

  const handlePasswordChange = async () => {
    if (!selectedUser?._id) return;
    if (!password || password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    await changePassword(selectedUser._id, password);
    setPassword("");
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser?._id) return;
    await deleteUser(selectedUser._id);
    setDeleteDialogOpen(false);
    setSheetOpen(false);
  };

  const handleToggleSelectUser = (userId) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      next.has(userId) ? next.delete(userId) : next.add(userId);
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedUserIds((prev) => {
      if (prev.size === users.length && users.length > 0) return new Set();
      const next = new Set(prev);
      users.forEach((u) => next.add(u._id));
      return next;
    });
  };

  const handleBulkAction = (action) => {
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
      <UserManagementHeader onCreateClick={handleCreateClick} />

      <UserFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        accountStatusFilter={accountStatusFilter}
        onAccountStatusChange={setAccountStatusFilter}
        userTypeFilter={userTypeFilter}
        onUserTypeChange={setUserTypeFilter}
        isLoadingUsers={loading.users}
      />

      {selectedUserIds.size > 0 && (
        <BulkActionBar
          selectedCount={selectedUserIds.size}
          onBulkAction={handleBulkAction}
          onClear={() => setSelectedUserIds(new Set())}
          isLoading={loading.bulkAction}
        />
      )}

      <div className="rounded-2xl border bg-card shadow-sm">
        <UserTable
          users={users}
          isLoading={loading.users}
          selectedUserIds={selectedUserIds}
          onRowClick={handleRowClick}
          onToggleSelect={handleToggleSelectUser}
          onSelectAll={handleSelectAll}
        />
        <UserPagination
          currentPage={pagination.currentPage}
          totalPages={totalPages}
          hasPreviousPage={pagination.hasPreviousPage}
          hasNextPage={pagination.hasNextPage}
          onPrevious={() => setPage((p) => Math.max(p - 1, 1))}
          onNext={() => setPage((p) => Math.min(p + 1, totalPages))}
        />
      </div>

      <UserSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        isCreateMode={isCreateMode}
        formState={formState}
        onInputChange={handleInputChange}
        avatarFile={avatarFile}
        onAvatarFileChange={setAvatarFile}
        password={password}
        onPasswordChange={setPassword}
        emailAvailability={emailAvailability}
        loading={loading}
        onSave={handleSave}
        onPasswordUpdate={handlePasswordChange}
        onDeleteClick={() => setDeleteDialogOpen(true)}
      />

      <DeleteUserDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        isLoading={loading.deleteUser}
      />

      <BulkActionDialog
        open={bulkActionDialogOpen}
        onOpenChange={setBulkActionDialogOpen}
        actionType={bulkActionType}
        selectedCount={selectedUserIds.size}
        onConfirm={handleBulkActionConfirm}
        isLoading={loading.bulkAction}
      />
    </div>
  );
};

export default UserManagementPage;
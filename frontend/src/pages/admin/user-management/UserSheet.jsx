import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Trash2 } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const UserSheet = ({
  open,
  onOpenChange,
  isCreateMode,
  formState,
  onInputChange,
  avatarFile,
  onAvatarFileChange,
  password,
  onPasswordChange,
  emailAvailability,
  loading,
  onSave,
  onPasswordUpdate,
  onDeleteClick,
}) => (
  <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent side="right" className="w-full max-w-xl">
      <SheetHeader>
        <SheetTitle>{isCreateMode ? "Create User" : "Update User"}</SheetTitle>
      </SheetHeader>

      <div className="mt-6">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">General</TabsTrigger>
            {!isCreateMode && <TabsTrigger value="danger">Danger</TabsTrigger>}
          </TabsList>

          <TabsContent value="general" className="space-y-6 pt-6">
            {/* Name & Email */}
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase text-muted-foreground">
                  Full Name
                </label>
                <Input
                  value={formState.fullName}
                  onChange={onInputChange("fullName")}
                  placeholder="Full name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase text-muted-foreground">
                  Email
                </label>
                <div className="relative">
                  <Input
                    value={formState.email}
                    onChange={onInputChange("email")}
                    placeholder="email@example.com"
                    className={
                      isCreateMode && emailAvailability.status === "checking" ? "pr-10" : ""
                    }
                  />
                  {isCreateMode && emailAvailability.status === "checking" && (
                    <Loader2 className="absolute right-3 top-3 size-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                {isCreateMode && emailAvailability.status !== "idle" && (
                  <p
                    className={`text-xs ${
                      emailAvailability.status === "available"
                        ? "text-emerald-600"
                        : emailAvailability.status === "checking"
                          ? "text-muted-foreground"
                          : "text-destructive"
                    }`}
                  >
                    {emailAvailability.message}
                  </p>
                )}
              </div>
            </div>

            {/* Role & Phone */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase text-muted-foreground">
                  Role
                </label>
                <Select value={formState.role} onValueChange={onInputChange("role")}>
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
                  onChange={onInputChange("phone")}
                  placeholder="Phone"
                />
              </div>
            </div>

            {/* Avatar */}
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
                    onChange={(e) => onAvatarFileChange(e.target.files?.[0] || null)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Upload to replace the current avatar.
                  </p>
                </div>
              </div>
            </div>

            {/* Password (create mode only) */}
            {isCreateMode && (
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase text-muted-foreground">
                  Password
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => onPasswordChange(e.target.value)}
                  placeholder="Minimum 8 characters"
                />
              </div>
            )}
          </TabsContent>

          {!isCreateMode && (
            <TabsContent value="danger" className="space-y-6 pt-6">
              {/* Block toggle */}
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
                    onInputChange("isBlocked")({ target: { value: Boolean(value) } })
                  }
                />
              </div>

              {/* Change password */}
              <div className="space-y-3">
                <p className="text-sm font-semibold">Change Password</p>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => onPasswordChange(e.target.value)}
                  placeholder="New password (minimum 8 characters)"
                />
                <Button
                  variant="outline"
                  onClick={onPasswordUpdate}
                  disabled={loading.changePassword}
                >
                  {loading.changePassword ? "Updating..." : "Change Password"}
                </Button>
              </div>

              {/* Delete */}
              <Button
                variant="destructive"
                onClick={onDeleteClick}
                disabled={loading.deleteUser}
              >
                <Trash2 className="mr-2 size-4" /> Delete User
              </Button>
            </TabsContent>
          )}
        </Tabs>

        <div className="mt-6 flex items-center justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={loading.updateUser || loading.createUser}>
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
);
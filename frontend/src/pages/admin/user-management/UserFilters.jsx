import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export const UserFilters = ({
  searchTerm,
  onSearchChange,
  accountStatusFilter,
  onAccountStatusChange,
  userTypeFilter,
  onUserTypeChange,
  isLoadingUsers,
}) => (
  <div className="flex flex-col md:flex-row gap-4">
    <div className="relative flex-1 max-w-md">
      <Input
        placeholder="Search by name or email"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pr-10"
      />
      {isLoadingUsers && (
        <Loader2 className="absolute right-3 top-2.5 size-4 animate-spin text-muted-foreground" />
      )}
    </div>

    <div className="flex gap-2">
      <Select value={accountStatusFilter} onValueChange={onAccountStatusChange}>
        <div className="relative">
          <Label
            htmlFor="account-status-filter"
            className="absolute bg-background text-xs px-1.5 py-0.5 top-0 left-1 -translate-y-1/2 text-muted-foreground"
          >
            Account Status
          </Label>
          <SelectTrigger id="account-status-filter" className="w-44">
            <SelectValue placeholder="Account Status" />
          </SelectTrigger>
        </div>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="emailVerified">Email Verified</SelectItem>
          <SelectItem value="emailUnVerified">Email UnVerified</SelectItem>
          <SelectItem value="blocked">Blocked</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="googleLinked">Google Linked</SelectItem>
          <SelectItem value="subscribed">Subscribed</SelectItem>
          <SelectItem value="nonSubscribed">Non-Subscribed</SelectItem>
        </SelectContent>
      </Select>

      <Select value={userTypeFilter} onValueChange={onUserTypeChange}>
        <div className="relative">
          <Label
            htmlFor="user-type-filter"
            className="absolute bg-background text-xs px-1.5 py-0.5 top-0 left-1 -translate-y-1/2 text-muted-foreground"
          >
            User Type
          </Label>
          <SelectTrigger id="user-type-filter" className="w-28">
            <SelectValue placeholder="User Type" />
          </SelectTrigger>
        </div>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="admin">Admin</SelectItem>
          <SelectItem value="user">User</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
);
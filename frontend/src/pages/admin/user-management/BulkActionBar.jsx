import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export const BulkActionBar = ({ selectedCount, onBulkAction, onClear, isLoading }) => (
  <div className="rounded-2xl border bg-card p-4 shadow-sm">
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-1">
        <p className="text-sm font-medium">{selectedCount} user(s) selected</p>
        <p className="text-xs text-muted-foreground">
          Choose an action to perform on selected users
        </p>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <Button size="sm" variant="outline" onClick={() => onBulkAction("BLOCK")} disabled={isLoading}>
          Block
        </Button>
        <Button size="sm" variant="outline" onClick={() => onBulkAction("UNBLOCK")} disabled={isLoading}>
          Unblock
        </Button>
        <Button size="sm" variant="outline" onClick={() => onBulkAction("MAKE_ADMIN")} disabled={isLoading}>
          Make Admin
        </Button>
        <Button size="sm" variant="outline" onClick={() => onBulkAction("MAKE_USER")} disabled={isLoading}>
          Make User
        </Button>
        <Button
          size="icon"
          variant="destructive"
          onClick={() => onBulkAction("DELETE")}
          disabled={isLoading}
          className="size-8"
        >
          <Trash2 />
        </Button>
        <Button size="sm" variant="ghost" onClick={onClear} disabled={isLoading}>
          Clear
        </Button>
      </div>
    </div>
  </div>
);
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

export const BulkActionDialog = ({
  open,
  onOpenChange,
  actionType,
  selectedCount,
  onConfirm,
  isLoading,
}) => {
  const isDelete = actionType === "DELETE";
  const actionLabel = actionType?.replace(/_/g, " ");

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isDelete
              ? "Delete users?"
              : `${actionLabel} ${selectedCount} user(s)?`}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              {isDelete ? (
                <>
                  <p>
                    This action cannot be undone. You are about to permanently
                    delete{" "}
                    <span className="font-semibold text-destructive">
                      {selectedCount}
                    </span>{" "}
                    {selectedCount === 1 ? "user" : "users"}.
                  </p>
                  <p>Are you sure?</p>
                </>
              ) : (
                <>
                  <p>
                    You are about to{" "}
                    <span className="font-semibold">
                      {actionLabel?.toLowerCase()}
                    </span>{" "}
                    <span className="font-semibold text-primary">
                      {selectedCount}
                    </span>{" "}
                    {selectedCount === 1 ? "user" : "users"}.
                  </p>
                  <p>Please confirm this action.</p>
                </>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className={
              isDelete
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : ""
            }
          >
            {isLoading ? "Processing..." : "Confirm"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

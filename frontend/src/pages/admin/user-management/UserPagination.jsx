import { Button } from "@/components/ui/button";

export const UserPagination = ({
  currentPage,
  totalPages,
  hasPreviousPage,
  hasNextPage,
  onPrevious,
  onNext,
}) => (
  <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
    <span>
      Page {currentPage} of {totalPages}
    </span>
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={onPrevious} disabled={!hasPreviousPage}>
        Previous
      </Button>
      <Button variant="outline" size="sm" onClick={onNext} disabled={!hasNextPage}>
        Next
      </Button>
    </div>
  </div>
);
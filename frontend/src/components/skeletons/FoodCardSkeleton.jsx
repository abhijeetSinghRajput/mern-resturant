import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const FoodCardSkeleton = ({ className }) => {
  return (
    <Card
      className={cn(
        "mx-auto w-full max-w-sm overflow-hidden rounded-2xl border shadow-sm",
        className
      )}
    >
      {/* Image Section */}
      <div className="relative aspect-[1/0.7] w-full overflow-hidden bg-muted">
        <Skeleton className="h-full w-full rounded-none" />
      </div>

      <CardHeader className="pb-2">
        {/* Title + Veg Indicator */}
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-5 w-3/4 rounded-md" />
          <Skeleton className="h-4 w-4 rounded-sm flex-shrink-0" />
        </div>

        {/* Category */}
        <Skeleton className="h-3 w-1/3 rounded-md mt-1" />
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Price + Prep Time */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-20 rounded-md" />
          <Skeleton className="h-4 w-16 rounded-md" />
        </div>

        {/* Add to Cart Button */}
        <Skeleton className="h-12 w-full rounded-xl" />
      </CardContent>
    </Card>
  );
};

export default FoodCardSkeleton;
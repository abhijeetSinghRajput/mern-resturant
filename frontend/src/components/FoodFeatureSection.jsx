import React from "react";
import FoodCard from "./FoodCard";
import { Button } from "./ui/button";
import FoodCardSkeleton from "./skeletons/FoodCardSkeleton";
import { useProductStore } from "@/stores/useProductStore";
import { CupSoda } from "lucide-react";

const FoodFeatureSection = ({ filteredProducts }) => {
  const { isLoadingProducts, productsError, fetchProducts } = useProductStore();

  return (
    <section className="mb-14">
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <div className="section-label mb-1.5">Available Items</div>
          <h2
            className="display-font"
            style={{
              fontSize: 28,
              fontWeight: 600,
              letterSpacing: "-0.02em",
            }}
          >
            {filteredProducts.length > 0
              ? "Browse our menu"
              : "No items available"}
          </h2>
        </div>
      </div>

      {isLoadingProducts ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(10)].map((_, i) => (
            <FoodCardSkeleton key={i} />
          ))}
        </div>
      ) : productsError ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{productsError}</p>
          <Button
            onClick={() => fetchProducts()}
            variant="outline"
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((item) => (
            <FoodCard key={item._id} item={item} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 px-6 py-12 text-center">
          <CupSoda className="size-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">No items in this category</p>
          <p className="text-xs text-muted-foreground">
            Try another category or add a new item.
          </p>
        </div>
      )}
    </section>
  );
};

export default FoodFeatureSection;

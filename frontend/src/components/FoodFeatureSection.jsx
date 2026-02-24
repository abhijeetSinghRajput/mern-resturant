import React from "react";
import FoodCard from "./FoodCard";
import { Button } from "./ui/button";
import FoodCardSkeleton from "./skeletons/FoodCardSkeleton";
import { useProductStore } from "@/stores/useProductStore";

const FoodFeatureSection = ({ filteredProducts, search }) => {
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
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
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
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
          {filteredProducts.map((item) => (
            <FoodCard key={item._id} item={item} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {search
              ? `No items found matching "${search}"`
              : "No items available in this category"}
          </p>
        </div>
      )}
    </section>
  );
};

export default FoodFeatureSection;

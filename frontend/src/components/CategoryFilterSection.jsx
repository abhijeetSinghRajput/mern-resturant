import React from "react";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { CupSoda, ChevronDown } from "lucide-react";
import { useProductStore } from "@/stores/useProductStore";

const CategoryFilterSection = ({ selectedCategory, onSelectCategory }) => {
  const { categories } = useProductStore();

  const isSelected = (id) => selectedCategory === id;

  return (
    <section className="mb-12">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-4 pb-6">
          {/* Show All card */}
          <div className="flex flex-col items-center shrink-0 gap-1">
            <button
              onClick={() => onSelectCategory(null)}
              className={`relative size-32 rounded-xl overflow-hidden group cursor-pointer transition-all bg-card border-2 ${
                isSelected(null) ? "border-primary" : "border-transparent"
              }`}
            >
              <div className="flex items-center justify-center h-full text-sm font-semibold">
                All
              </div>
            </button>
            {isSelected(null) && (
              <div className="rounded-full px-2 py-1 w-full bg-muted flex items-center justify-center">
                <ChevronDown className="size-5 text-primary -mt-1 shrink-0" />
              </div>
            )}
          </div>

          {categories.map((category) => (
            <div
              key={category._id}
              className="flex flex-col items-center shrink-0 gap-1"
            >
              <div
                onClick={() => onSelectCategory(category._id)}
                className={`relative size-32 rounded-xl overflow-hidden group cursor-pointer transition-all border-2 ${
                  isSelected(category._id)
                    ? "border-primary"
                    : "border-transparent"
                }`}
              >
                <Avatar className="size-full rounded-none">
                  <AvatarImage
                    src={category.image?.url}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <AvatarFallback className="rounded-none">
                    <CupSoda className="size-1/3 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

                <div className="absolute bottom-2 left-2 right-2 text-white">
                  <p className="text-sm font-semibold truncate">
                    {category.name}
                  </p>
                  <div className="mt-1 text-[10px] flex items-center justify-between">
                    <span
                      className={`px-2 py-0 rounded ${category.isActive ? "bg-white/10" : "bg-red-600"}`}
                    >
                      {" "}
                      {category.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
              {isSelected(category._id) && (
                <div className="rounded-full px-2 py-1 w-full bg-muted flex items-center justify-center">
                  <ChevronDown className="size-5 text-primary -mt-1 shrink-0" />
                </div>
              )}
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  );
};

export default CategoryFilterSection;

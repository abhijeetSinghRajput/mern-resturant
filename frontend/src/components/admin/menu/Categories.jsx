import { useEffect, useState } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pen, Plus, Loader2, CupSoda } from "lucide-react";
import { useFoodStore } from "@/stores/admin/adminMenuStore";
import { CategoryFormModal } from "./CategoryFormModal";

const Categories = ({ selectedCategoryId, onSelectCategory }) => {
  const { categories, fetchCategories, loading } = useFoodStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddCategory = () => {
    setEditingId(null);
    setModalOpen(true);
  };

  const handleEditCategory = (categoryId) => {
    setEditingId(categoryId);
    setModalOpen(true);
  };

  const handleCategoryClick = (categoryId) => {
    onSelectCategory?.(categoryId);
  };

  if (loading.categories) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-4 pb-4">
            {/* Add Category Card */}
            <Button
              onClick={handleAddCategory}
              variant="ghost"
              className="relative size-32 shrink-0 border-2 border-dashed rounded-xl flex items-center justify-center hover:bg-muted transition"
            >
              <Plus className="!size-1/3 text-muted-foreground" />
            </Button>
            <Button
              onClick={() => onSelectCategory?.(null)}
              variant="secondary"
              className="relative text-muted-foreground size-32 shrink-0 border-2  rounded-xl flex items-center justify-center hover:bg-muted transition"
            >
              Show All
            </Button>

            {/* Category Cards */}
            {categories.map((category) => (
              <div
                key={category._id}
                onClick={() => handleCategoryClick(category._id)}
                className={`relative size-32 shrink-0 rounded-xl overflow-hidden group cursor-pointer transition-all ${
                  selectedCategoryId === category._id
                    ? "ring-2 ring-primary"
                    : "ring-1 ring-transparent"
                }`}
              >
                <Avatar className="size-full rounded-none">
                  <AvatarImage
                    src={category.image?.url}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <AvatarFallback className="rounded-none">
                    <CupSoda className="size-1/3 text-muted-foreground"/>
                  </AvatarFallback>
                </Avatar>

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

                {/* Content */}
                <div className="absolute bottom-2 left-2 right-2 text-white">
                  <p className="text-sm font-semibold truncate">
                    {category.name}
                  </p>

                  <div className="flex justify-between items-center">
                    <Badge
                      variant={category.isActive ? "default" : "destructive"}
                      className="mt-1 text-[10px] px-2 py-0"
                    >
                      {category.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Button
                      size="icon"
                      className="size-7 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditCategory(category._id);
                      }}
                    >
                      <Pen className="size-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      <CategoryFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        editingId={editingId}
      />
    </>
  );
};

export default Categories;

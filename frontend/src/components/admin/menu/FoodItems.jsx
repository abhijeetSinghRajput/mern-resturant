import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useFoodStore } from "@/stores/admin/adminMenuStore";
import { Clock, CupSoda, Edit, Loader2, Pen, Pizza, Plus, Trash2 } from "lucide-react";
import { FoodItemFormModal } from "./FoodItemFormModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const FoodItems = ({ categoryId }) => {
  const { foodItems, fetchFoodItems, deleteFoodItem, loading } = useFoodStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, item: null });

  useEffect(() => {
    fetchFoodItems(categoryId || undefined);
  }, [fetchFoodItems, categoryId]);

  const handleAdd = () => {
    setEditingId(null);
    setModalOpen(true);
  };

  const handleEdit = (id) => {
    setEditingId(id);
    setModalOpen(true);
  };

  const handleDeleteRequest = (item) => {
    setDeleteDialog({ open: true, item });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.item?._id) {
      return;
    }
    await deleteFoodItem(deleteDialog.item._id);
    setDeleteDialog({ open: false, item: null });
  };

  if (loading.foodItems) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto w-full max-w-7xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Food Items</h3>
          <Button onClick={handleAdd}>
            <Plus className="size-4 mr-2" /> Add Food Item
          </Button>
        </div>

        {foodItems.length === 0 && categoryId ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 px-6 py-12 text-center">
            <CupSoda className="size-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">No items in this category</p>
            <p className="text-xs text-muted-foreground">
              Try another category or add a new item.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {foodItems.map((item) => (
              <Card
                key={item._id}
                className="mx-auto w-full max-w-sm overflow-hidden rounded-2xl border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
              {/* Image Section */}
              <div className="relative aspect-[1/0.7] w-full overflow-hidden bg-muted">
                <Avatar className="size-full rounded-none bg-muted">
                  <AvatarImage
                  src={item.image.url}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                  <AvatarFallback className="rounded-none">
                    <Pizza className="size-1/3 opacity-20"/>
                  </AvatarFallback>
                </Avatar>

                {/* Availability Badge */}
                <Badge
                  variant={item.isAvailable ? "secondary" : "destructive"}
                  className="absolute top-3 right-3 text-xs px-3 py-1 rounded-full shadow-sm"
                >
                  {item.isAvailable ? "Available" : "Unavailable"}
                </Badge>
              </div>

              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center justify-between gap-2">
                  <span className="truncate">{item.name}</span>

                  {/* Veg Indicator */}
                  <div
                    className={`w-4 h-4 rounded-sm border flex items-center justify-center ${
                      item.isVeg ? "border-green-600" : "border-red-600"
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        item.isVeg ? "bg-green-600" : "bg-red-600"
                      }`}
                    />
                  </div>
                </CardTitle>

                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {item.categoryId?.name || "Uncategorized"}
                </p>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Price + Prep Time */}
                <div className="flex items-center justify-between">
                  <div className="text-xl font-bold tracking-tight">
                    <span className="text-sm text-muted-foreground mr-1">
                      ₹
                    </span>
                    {Number(item.price || 0).toFixed(2)}
                  </div>

                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="size-4" />
                    {item.prepTime || 0} min
                  </div>
                </div>

                <div className="border-t" />

                {/* Actions */}
                <div className="grid grid-cols-2 items-center justify-end gap-2">
                  <Button
                    onClick={() => handleEdit(item._id)}
                    className="rounded-xl h-11"
                  >
                    <Edit />
                    Edit
                  </Button>

                  <Button
                    variant="secondary"
                    onClick={() => handleDeleteRequest(item)}
                    disabled={loading.deleteFoodItem}
                    className="rounded-xl h-11"
                  >
                    <Trash2 />
                    Delete
                  </Button>
                </div>
              </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <FoodItemFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        editingId={editingId}
      />

      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          setDeleteDialog((prev) => ({
            open,
            item: open ? prev.item : null,
          }))
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete food item?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialog.item?.name
                ? `Are you sure you want to delete "${deleteDialog.item.name}"? This action cannot be undone.`
                : "Are you sure you want to delete this food item? This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading.deleteFoodItem}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={loading.deleteFoodItem}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading.deleteFoodItem ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default FoodItems;

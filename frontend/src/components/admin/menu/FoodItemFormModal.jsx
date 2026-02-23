import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useFoodStore } from "@/stores/admin/adminMenuStore";
import { useImageStore } from "@/stores/useImageStore";
import { ImagePlus, Leaf, Clock, IndianRupee, Sparkles, X, Loader2 } from "lucide-react";
import FileDropZone from "@/components/FileDropZone";

const foodItemSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be 0 or greater"),
  imageUrl: z.string().optional(),
  isAvailable: z.boolean().default(true),
  isVeg: z.boolean().default(false),
  prepTime: z.coerce.number().min(0, "Prep time must be 0 or greater"),
});

export function FoodItemFormModal({ open, onOpenChange, editingId }) {
  const [showImageDialog, setShowImageDialog] = useState(false);
  const { categories, foodItems, createFoodItem, updateFoodItem, loading } =
    useFoodStore();
  const { getImages } = useImageStore();

  const editingFoodItem = useMemo(
    () => (editingId ? foodItems.find((item) => item._id === editingId) : null),
    [editingId, foodItems],
  );

  const form = useForm({
    resolver: zodResolver(foodItemSchema),
    defaultValues: {
      categoryId: "",
      name: "",
      slug: "",
      description: "",
      price: 0,
      imageUrl: "",
      isAvailable: true,
      isVeg: false,
      prepTime: 0,
    },
  });

  useEffect(() => {
    if (open) {
      getImages();
    }
  }, [open, getImages]);

  useEffect(() => {
    if (editingFoodItem) {
      form.reset({
        categoryId:
          typeof editingFoodItem.categoryId === "string"
            ? editingFoodItem.categoryId
            : editingFoodItem.categoryId?._id || "",
        name: editingFoodItem.name || "",
        slug: editingFoodItem.slug || "",
        description: editingFoodItem.description || "",
        price: Number(editingFoodItem.price || 0),
        imageUrl: editingFoodItem.image?.url || "",
        isAvailable: Boolean(editingFoodItem.isAvailable),
        isVeg: Boolean(editingFoodItem.isVeg),
        prepTime: Number(editingFoodItem.prepTime || 0),
      });
      return;
    }

    form.reset({
      categoryId: categories[0]?._id || "",
      name: "",
      slug: "",
      description: "",
      price: 0,
      imageUrl: "",
      isAvailable: true,
      isVeg: false,
      prepTime: 0,
    });
  }, [editingFoodItem, categories, form]);

  const handleNameChange = (name) => {
    form.setValue("name", name);
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    form.setValue("slug", slug);
  };

  const onSubmit = async (values) => {
    const payload = {
      categoryId: values.categoryId,
      name: values.name,
      slug: values.slug,
      description: values.description ?? "",
      price: values.price,
      image: values.imageUrl ? { url: values.imageUrl } : undefined,
      isAvailable: values.isAvailable,
      isVeg: values.isVeg,
      prepTime: values.prepTime,
    };

    if (editingId) {
      await updateFoodItem(editingId, payload);
    } else {
      await createFoodItem(payload);
    }
    onOpenChange(false);
  };

  const imageUrl = form.watch("imageUrl");

  const handleImageSelect = (url) => {
    form.setValue("imageUrl", url);
    setShowImageDialog(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden rounded-xl">
          <DialogHeader className="px-6 pt-6 pb-4 border-b bg-secondary/30">
            <div className="flex items-center gap-3">
              <div>
                <DialogTitle className="text-lg font-semibold text-left">
                  {editingId ? "Edit Food Item" : "Add Food Item"}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  {editingId
                    ? "Update the details below"
                    : "Fill in the details to add a new item"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col"
            >
              <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                  {imageUrl ? (
                    <div className="relative group rounded-lg overflow-hidden border">
                      <img
                        src={imageUrl}
                        alt="Selected"
                        className="h-36 w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => form.setValue("imageUrl", "")}
                        className="absolute top-2 right-2 size-7 rounded-full bg-foreground/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="size-4 text-background" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowImageDialog(true)}
                      className="w-full h-28 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50 transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer"
                    >
                      <ImagePlus className="size-6 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Click to select from gallery
                      </span>
                    </button>
                  )}
                </div>
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Category
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11 rounded-lg">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category._id} value={category._id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Name
                        </FormLabel>
                        <FormControl>
                          <Input
                            className="h-11 rounded-lg"
                            placeholder="Paneer Tikka"
                            value={field.value}
                            onChange={(e) => handleNameChange(e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Slug
                        </FormLabel>
                        <FormControl>
                          <Input
                            className="h-11 rounded-lg font-mono text-sm"
                            placeholder="paneer-tikka"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Price
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              className="h-11 rounded-lg pl-9"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="prepTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Prep Time
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input
                              type="number"
                              min="0"
                              step="1"
                              className="h-11 rounded-lg pl-9"
                              placeholder="minutes"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Description
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          className="rounded-lg resize-none"
                          placeholder="A brief description of the dish..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <FormField
                    control={form.control}
                    name="isAvailable"
                    render={({ field }) => (
                      <FormItem className=" space-y-2 flex flex-col">
                        <FormLabel className="font-medium text-sm cursor-pointer">
                          Available
                        </FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={(value) =>
                              field.onChange(Boolean(value))
                            }
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isVeg"
                    render={({ field }) => (
                      <FormItem className=" space-y-2 flex flex-col">
                        <FormLabel className="font-medium text-sm cursor-pointer">
                          Vegetarian
                        </FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={(value) =>
                              field.onChange(Boolean(value))
                            }
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <DialogFooter className="px-6 py-4 border-t bg-secondary/30 flex-row gap-3 sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-lg"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading.createFoodItem || loading.updateFoodItem}
                  className="rounded-lg min-w-[100px]"
                >
                  {loading.createFoodItem || loading.updateFoodItem ? (
                    <span className="flex items-center gap-2">
                      <span className="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Saving…
                    </span>
                  ) : editingId ? (
                    "Update Item"
                  ) : (
                    "Create Item"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="max-w-3xl rounded-xl">
          <DialogHeader>
            <DialogTitle>Select Image</DialogTitle>
          </DialogHeader>
          <FileDropZone onImageSelect={handleImageSelect} />
        </DialogContent>
      </Dialog>
    </>
  );
}

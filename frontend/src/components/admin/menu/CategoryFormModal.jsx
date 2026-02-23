import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { Switch } from "@/components/ui/switch";
import { useFoodStore } from "@/stores/admin/adminMenuStore";
import { useImageStore } from "@/stores/useImageStore";
import FileDropZone from "@/components/FileDropZone";
import { ImagePlus, Sparkles, X } from "lucide-react";

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  isActive: z.boolean().default(true),
});

export function CategoryFormModal({ open, onOpenChange, editingId }) {
  const [showImageDialog, setShowImageDialog] = useState(false);
  const { getImages } = useImageStore();
  const { createCategory, updateCategory, categories, loading } = useFoodStore();

  const editingCategory = editingId
    ? categories.find((category) => category._id === editingId)
    : null;

  const form = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      imageUrl: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (open) {
      getImages();
    }
  }, [open, getImages]);

  useEffect(() => {
    if (editingCategory) {
      form.reset({
        name: editingCategory.name || "",
        slug: editingCategory.slug || "",
        description: editingCategory.description || "",
        imageUrl: editingCategory.image?.url || "",
        isActive: Boolean(editingCategory.isActive),
      });
      return;
    }

    form.reset({
      name: "",
      slug: "",
      description: "",
      imageUrl: "",
      isActive: true,
    });
  }, [editingCategory, categories, form]);

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
      name: values.name,
      slug: values.slug,
      description: values.description ?? "",
      image: values.imageUrl ? { url: values.imageUrl } : undefined,
      isActive: values.isActive,
    };

    if (editingId) {
      await updateCategory(editingId, payload);
    } else {
      await createCategory(payload);
    }

    onOpenChange(false);
  };

  const imageUrl = form.watch("imageUrl");

  const handleImageSelect = (url) => {
    form.setValue("imageUrl", url);
    setShowImageDialog(false);
  };

  const isSubmitting = loading.createCategory || loading.updateCategory;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden rounded-xl">
          <DialogHeader className="px-6 pt-6 pb-4 border-b bg-secondary/30">
            <div className="flex items-center gap-3">
              <div>
                <DialogTitle className="text-lg font-semibold text-left">
                  {editingId ? "Edit Category" : "Add Category"}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  {editingId
                    ? "Update the details below"
                    : "Fill in the details to add a new category"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col">
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
                            placeholder="Starters"
                            value={field.value}
                            onChange={(event) => handleNameChange(event.target.value)}
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
                            placeholder="starters"
                            {...field}
                          />
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
                          placeholder="A brief description of the category..."
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
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="space-y-2 flex flex-col">
                        <FormLabel className="font-medium text-sm cursor-pointer">
                          Active Category
                        </FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={(value) => field.onChange(Boolean(value))}
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
                  disabled={isSubmitting}
                  className="rounded-lg min-w-[120px]"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Saving…
                    </span>
                  ) : editingId ? (
                    "Update Category"
                  ) : (
                    "Create Category"
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

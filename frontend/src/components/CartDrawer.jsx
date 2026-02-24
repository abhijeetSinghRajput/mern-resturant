import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Plus, Minus, Trash2, X, Loader2 } from "lucide-react";
import { useProductStore } from "@/stores/useProductStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Pizza } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function CartDrawer({ open, onOpenChange }) {
  const {
    cart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    getCart,
  } = useProductStore();
  const { authUser } = useAuthStore();
  const [placing, setPlacing] = useState(false);

  const cartData = getCart();
  const totalAmount = cartData.subtotal;
  const itemCount = cartData.itemCount;

  const handleClearCart = () => {
    clearCart();
    toast.success("Cart Cleared", {
      description: "All items have been removed from your cart.",
    });
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Cart is Empty", {
        description: "Add some items to proceed with checkout.",
      });
      return;
    }
    if (!authUser) {
      toast.error("Login required", {
        description: "Please sign in to place an order.",
      });
      return;
    }
    setPlacing(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          items: cart.map((i) => ({
            foodItemId: i._id,
            quantity: i.quantity,
          })),
          orderType: "dine-in",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Order failed");
      toast.success("Order Placed!", {
        description: "Your order has been placed successfully.",
      });
      clearCart();
      onOpenChange(false);
    } catch (e) {
      toast.error("Order failed", {
        description: e instanceof Error ? e.message : "Could not place order.",
      });
    } finally {
      setPlacing(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-lg p-4">
        <SheetHeader className="p-0 mb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Your Cart
              {itemCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {itemCount} items
                </Badge>
              )}
            </SheetTitle>
          </div>
          <SheetDescription>
            Review your items and proceed to checkout
          </SheetDescription>
        </SheetHeader>

        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <div className="rounded-full bg-muted p-6">
              <ShoppingCart className="h-12 w-12 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Your cart is empty</h3>
              <p className="text-sm text-muted-foreground">
                Add delicious items from our menu to get started!
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-end pb-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear Cart
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear your cart?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove all {itemCount} item{itemCount > 1 ? "s" : ""} from your cart. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleClearCart}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Clear Cart
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <ScrollArea className="flex-1 -mx-4 px-4">
              <div className="space-y-4">
                {cart.map((item) => (
                  <div
                    key={item._id}
                    className="flex gap-4 rounded-lg border bg-card p-3"
                  >
                    <Avatar className="h-20 w-20 rounded-md">
                      <AvatarImage
                        src={item.image?.url}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                      <AvatarFallback className="rounded-md">
                        <Pizza className="size-6 opacity-20" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-1 flex-col">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium leading-tight">
                            {item.name}
                          </h4>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {item.isVeg && (
                              <Badge className="bg-green-600 text-white text-xs hover:bg-green-600/90">
                                Veg
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {item.categoryId?.name || "Uncategorized"}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => removeFromCart(item._id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <span className="font-semibold text-primary">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              updateCartQuantity(item._id, item.quantity - 1)
                            }
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              updateCartQuantity(item._id, item.quantity + 1)
                            }
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <Separator className="my-4" />

            <SheetFooter className="flex-col gap-4 sm:flex-col">
              <div className="flex items-center justify-between text-lg font-semibold">
                <span>Total Amount</span>
                <span className="text-primary">₹{totalAmount.toFixed(2)}</span>
              </div>
              <Button
                className="w-full"
                size="lg"
                onClick={handleCheckout}
                disabled={placing}
              >
                {placing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Placing order…
                  </>
                ) : (
                  "Proceed to Checkout"
                )}
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

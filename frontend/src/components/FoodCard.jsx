import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Ban, Clock, Minus, Pizza, Plus, ShoppingCart } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { useProductStore } from "@/stores/useProductStore";
import { cn } from "@/lib/utils";

const FoodCard = ({ item, className }) => {
  const { addToCart, removeFromCart, updateCartQuantity, getCartItemQuantity, cartError } =
    useProductStore();

  const quantity = getCartItemQuantity(item._id);

  const handleAddToCart = () => {
    addToCart(item._id, 1);
  };

  const handleIncrement = () => {
    updateCartQuantity(item._id, quantity + 1);
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      updateCartQuantity(item._id, quantity - 1);
    } else {
      removeFromCart(item._id);
    }
  };

  return (
    <Card
      key={item._id}
      className={cn("mx-auto w-full max-w-sm overflow-hidden rounded-2xl border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl", className)}
    >
      {/* Image Section */}
      <div className="relative aspect-[1/0.7] w-full overflow-hidden bg-muted">
        <Avatar className="size-full rounded-none bg-muted">
          <AvatarImage
            src={item.image?.url}
            alt={item.name}
            className="h-full w-full object-cover"
          />
          <AvatarFallback className="rounded-none">
            <Pizza className="size-1/3 opacity-20" />
          </AvatarFallback>
        </Avatar>

        {!item.isAvailable && (
          <>
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
              <Ban className="size-1/4 text-muted-foreground" />
            </div>
            <Badge
              variant={"destructive"}
              className="absolute top-3 right-3 text-xs px-3 py-1 rounded-full shadow-sm"
            >
              Unavailable
            </Badge>
          </>
        )}
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
            <span className="text-sm text-muted-foreground mr-1">₹</span>
            {Number(item.price || 0).toFixed(2)}
          </div>

          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="size-4" />
            {item.prepTime || 0} min
          </div>
        </div>

        {/* Add to Cart Section */}
        {quantity === 0 ? (
          <Button
            onClick={handleAddToCart}
            disabled={!item.isAvailable}
            className="w-full gap-2 h-12 rounded-xl"
            size="sm"
          >
            <ShoppingCart className="size-4" />
            Add to Cart
          </Button>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDecrement}
              className="flex-1"
            >
              <Minus className="size-4" />
            </Button>
            <span className="flex-1 text-center font-semibold text-sm">
              {quantity}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleIncrement}
              className="flex-1"
            >
              <Plus className="size-4" />
            </Button>
          </div>
        )}

        {cartError && (
          <p className="text-xs text-destructive text-center">{cartError}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default FoodCard;

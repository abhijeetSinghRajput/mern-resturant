import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProductStore } from "@/stores/useProductStore";
import { Search, ShoppingCart } from "lucide-react";
import AppHeader from "@/components/app-header";
import Footer from "@/components/Footer";
import FoodFeatureSection from "@/components/FoodFeatureSection";
import CategoryFilterSection from "@/components/CategoryFilterSection";
import { CartDrawer } from "@/components/CartDrawer";

export default function FoodOrderingApp() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const {
    products,
    fetchProducts,
    getCart,
    searchProducts,
    fetchCategories,
  } = useProductStore();

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // Filter products based on search and category
  const filteredProducts = (() => {
    let filtered = products;

    if (search.trim()) {
      filtered = searchProducts(search);
    }

    if (selectedCategory) {
      filtered = filtered.filter((p) => p.categoryId?._id === selectedCategory);
    }

    return filtered;
  })();

  const cartData = getCart();
  const cartCount = cartData.itemCount;
  const cartTotal = cartData.total;

  return (
    <div className="min-h-screen bg-background text-foreground font-[DM_Sans]">
      {/* NAV */}
      <AppHeader onCartClick={() => setCartOpen(true)} />

      <div className="max-w-[1200px] mx-auto px-6 relative z-10">
        {/* SEARCH */}
        <section className="mb-10">
          <div className="relative max-w-[560px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-base text-muted-foreground" />
            <Input
              className="h-12 rounded-full pl-14 bg-input/20"
              placeholder="Search dishes, restaurants, cuisines…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </section>

        <CategoryFilterSection
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
        <FoodFeatureSection
          filteredProducts={filteredProducts}
          search={search}
        />
        <Footer />
      </div>

      {/* FLOATING CART */}
      {cartCount > 0 && (
        <div className="fixed bottom-7 left-1/2 -translate-x-1/2 z-[100] animate-[popIn_0.4s_cubic-bezier(.34,1.56,.64,1)]">
          <Button
            className="h-12 rounded-full gap-2"
            onClick={() => setCartOpen(true)}
          >
            {/* Count Badge */}
            <Badge
              className={"bg-primary-foreground text-primary rounded-full"}
            >
              {cartCount}
            </Badge>

            <span>View cart</span>

            <span className="font-bold">₹{cartTotal.toFixed(2)}</span>
          </Button>
        </div>
      )}

      {/* CART DRAWER */}
      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
    </div>
  );
}

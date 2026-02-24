import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useAuthStore } from "@/stores/useAuthStore";
import { useProductStore } from "@/stores/useProductStore";
import { Clock, Loader2, Search, ShoppingCart, CupSoda } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import AppHeader from "@/components/app-header";
import FoodCard from "@/components/FoodCard";

export default function FoodOrderingApp() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const { authUser } = useAuthStore();
  const {
    products,
    isLoadingProducts,
    productsError,
    fetchProducts,
    getCart,
    searchProducts,
    filterByCategory,
    categories,
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
      filtered = filtered.filter(
        (p) => p.categoryId?._id === selectedCategory
      );
    }

    return filtered;
  })();


  const cartData = getCart();
  const cartCount = cartData.itemCount;
  const cartTotal = cartData.total;

  return (
    <div className="min-h-screen bg-background text-foreground font-[DM_Sans]">
      {/* NAV */}
      <AppHeader/>

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

        {/* CATEGORIES */}
        <section className="mb-12">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-4 pb-4">
              {/* Show All card */}
              <button
                onClick={() => setSelectedCategory(null)}
                className="relative size-32 shrink-0 rounded-xl overflow-hidden group cursor-pointer transition-all bg-card border"
              >
                <div className="p-4">All</div>
              </button>

              {categories.map((category) => (
                <div
                  key={category._id}
                  onClick={() => setSelectedCategory(category._id)}
                  className={`relative size-32 shrink-0 rounded-xl overflow-hidden group cursor-pointer transition-all ${
                    selectedCategory === category._id ? "ring-2 ring-primary" : "ring-1 ring-transparent"
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
                    <p className="text-sm font-semibold truncate">{category.name}</p>
                    <div className="mt-1 text-[10px] flex items-center justify-between">
                      <span className={`px-2 py-0 rounded ${category.isActive ? 'bg-white/10' : 'bg-red-600'}`}> {category.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </section>

        <section style={{ marginBottom: 56 }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginBottom: 24,
            }}
          >
            <div>
              <div className="section-label" style={{ marginBottom: 6 }}>
                Available Items
              </div>
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
            <div className="flex justify-center items-center py-12">
              <Loader2 className="animate-spin size-8 text-muted-foreground" />
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

        {/* PROMO BANNER */}
        <section className="mb-16">
          <Card className="relative overflow-hidden rounded-3xl border-none bg-foreground text-background">
            <CardContent className="flex items-center justify-between px-12 py-10">
              {/* LEFT CONTENT */}
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2.5">
                  Limited Time
                </div>

                <h2 className="font-[Fraunces] text-[34px] font-semibold tracking-[-0.02em] leading-[1.1] mb-3">
                  First order 20% off.
                  <br />
                  <em className="italic text-accent">No strings attached.</em>
                </h2>

                <p className="text-sm text-muted-foreground mb-6 max-w-[360px]">
                  Use code NOURI20 at checkout. Valid for new users only. Ends
                  tonight.
                </p>

                <div className="flex gap-3 items-center">
                  <Input
                    type="email"
                    placeholder="Your email"
                    className="h-10 bg-input/10"
                  />

                  <Button variant="secondary" className="h-[42px]">
                    Claim offer
                  </Button>
                </div>
              </div>

              {/* RIGHT ICON */}
              <div className="text-[8rem] opacity-15 select-none pointer-events-none">
                🎁
              </div>
            </CardContent>
          </Card>
        </section>

        {/* FOOTER */}
        <footer style={{ paddingBottom: 48 }}>
          <Separator style={{ marginBottom: 32 }} />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>✦</span>
              <span
                className="display-font"
                style={{ fontSize: 16, fontWeight: 600 }}
              >
                nouri
              </span>
            </div>
            <div style={{ display: "flex", gap: 24 }}>
              {["About", "Careers", "Partners", "Support", "Privacy"].map(
                (link) => (
                  <a
                    key={link}
                    href="#"
                    style={{
                      fontSize: 13,
                      color: "hsl(var(--muted-foreground))",
                      textDecoration: "none",
                    }}
                  >
                    {link}
                  </a>
                ),
              )}
            </div>
            <p style={{ fontSize: 12, color: "hsl(var(--muted-foreground))" }}>
              © 2025 Nouri Inc.
            </p>
          </div>
        </footer>
      </div>

      {/* FLOATING CART */}
      {cartCount > 0 && (
        <div className="fixed bottom-7 left-1/2 -translate-x-1/2 z-[100] animate-[popIn_0.4s_cubic-bezier(.34,1.56,.64,1)]">
          <Button className="h-12 rounded-full gap-2">
            {/* Count Badge */}
            <span
              className="w-[22px] h-[22px] rounded-full bg-accent text-white 
                       flex items-center justify-center text-xs font-bold"
            >
              {cartCount}
            </span>

            <span>View cart</span>

            <span className="font-bold">₹{cartTotal.toFixed(2)}</span>
          </Button>
        </div>
      )}
    </div>
  );
}

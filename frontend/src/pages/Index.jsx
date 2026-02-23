import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useAuthStore } from "@/stores/useAuthStore";
import { Clock, Plus, Search, ShoppingCart } from "lucide-react";
import AppHeader from "@/components/app-header";

const categories = [
  { id: 1, name: "All", icon: "✦" },
  { id: 2, name: "Burgers", icon: "🍔" },
  { id: 3, name: "Pizza", icon: "🍕" },
  { id: 4, name: "Sushi", icon: "🍱" },
  { id: 5, name: "Tacos", icon: "🌮" },
  { id: 6, name: "Salads", icon: "🥗" },
  { id: 7, name: "Desserts", icon: "🍮" },
  { id: 8, name: "Drinks", icon: "🧃" },
];

const featured = [
  {
    id: 1,
    name: "Wagyu Smash Burger",
    restaurant: "Smoke & Flame",
    price: 24,
    rating: 4.9,
    reviews: 1240,
    time: "18–25 min",
    tag: "Chef's Pick",
    tagColor: "bg-amber-100 text-amber-800",
    img: "🍔",
    bg: "from-amber-50 to-orange-50",
    accent: "#f97316",
  },
  {
    id: 2,
    name: "Truffle Margherita",
    restaurant: "Forno Classico",
    price: 22,
    rating: 4.8,
    reviews: 897,
    time: "22–30 min",
    tag: "Bestseller",
    tagColor: "bg-rose-100 text-rose-800",
    img: "🍕",
    bg: "from-rose-50 to-pink-50",
    accent: "#f43f5e",
  },
  {
    id: 3,
    name: "Omakase Nigiri Set",
    restaurant: "Hana Sushi",
    price: 48,
    rating: 5.0,
    reviews: 562,
    time: "30–40 min",
    tag: "Premium",
    tagColor: "bg-sky-100 text-sky-800",
    img: "🍱",
    bg: "from-sky-50 to-blue-50",
    accent: "#0ea5e9",
  },
];

const popular = [
  {
    id: 1,
    name: "Street Tacos al Pastor",
    restaurant: "La Paloma",
    price: 14,
    rating: 4.7,
    time: "15 min",
    img: "🌮",
  },
  {
    id: 2,
    name: "Mango Ceviche Bowl",
    restaurant: "Coastal Kitchen",
    price: 18,
    rating: 4.8,
    time: "20 min",
    img: "🥗",
  },
  {
    id: 3,
    name: "Crème Brûlée Tart",
    restaurant: "Patisserie Margot",
    price: 11,
    rating: 4.9,
    time: "10 min",
    img: "🍮",
  },
  {
    id: 4,
    name: "Dragon Fruit Smoothie",
    restaurant: "Bloom Bar",
    price: 9,
    rating: 4.6,
    time: "8 min",
    img: "🧃",
  },
  {
    id: 5,
    name: "Bao Buns Trio",
    restaurant: "Lucky Red",
    price: 16,
    rating: 4.8,
    time: "25 min",
    img: "🥢",
  },
  {
    id: 6,
    name: "Shakshuka Pan",
    restaurant: "The Atlas",
    price: 17,
    rating: 4.7,
    time: "22 min",
    img: "🍳",
  },
];

export default function FoodOrderingApp() {
  const [activeCategory, setActiveCategory] = useState(1);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const { authUser } = useAuthStore();

  const addToCart = (item) => {
    setCart((prev) => {
      const exists = prev.find((i) => i.id === item.id);
      if (exists)
        return prev.map((i) =>
          i.id === item.id ? { ...i, qty: i.qty + 1 } : i,
        );
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);
  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

  return (
    <div className="min-h-screen bg-background text-foreground font-[DM_Sans]">
      {/* NAV */}
      <AppHeader/>

      <div className="max-w-[1200px] mx-auto px-6 relative z-10">
        {/* HERO */}
        <section className="pt-16 pb-14 grid grid-cols-2 gap-12 items-center">
          <div>
            <Badge className="mb-5 rounded-full border-none text-[12px] font-medium bg-orange-300 text-orange-800 dark:bg-orange-500/30 dark:text-orange-300">
              Free delivery today →
            </Badge>

            <h1 className="font-[Fraunces] text-[clamp(42px,6vw,68px)] font-semibold leading-[1.05] tracking-[-0.03em] mb-5">
              Food that
              <br />
              <em className="italic text-muted-foreground">actually</em>
              <br />
              excites you.
            </h1>

            <p className="text-[16px] text-muted-foreground leading-[1.6] max-w-[380px] mb-8">
              Curated restaurants. Real ingredients. Delivered to your door in
              under 30 minutes.
            </p>

            <div className="flex gap-2.5">
              <Button className="h-12 px-7 rounded-full bg-foreground text-background text-[14px] font-medium">
                Order now
              </Button>
              <Button
                variant="outline"
                className="h-12 px-6 rounded-full text-[14px]"
              >
                Explore menus
              </Button>
            </div>

            <div className="mt-10 flex gap-8">
              {[
                ["200+", "Restaurants"],
                ["4.9★", "Avg rating"],
                ["25min", "Avg delivery"],
              ].map(([val, label]) => (
                <div key={label}>
                  <div className="font-[Fraunces] text-[26px] font-semibold tracking-[-0.02em]">
                    {val}
                  </div>
                  <div className="text-[12px] text-muted-foreground mt-0.5">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>right</div>
        </section>

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
            <div className="flex gap-2.5 pb-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full border-[1.5px] text-[13px] font-medium transition-all whitespace-nowrap ${
                    activeCategory === cat.id
                      ? "bg-foreground text-background border-foreground"
                      : "bg-card text-foreground border-border"
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
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
                Featured Today
              </div>
              <h2
                className="display-font"
                style={{
                  fontSize: 28,
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                }}
              >
                Chef's recommendations
              </h2>
            </div>
            <button
              style={{
                fontSize: 13,
                color: "hsl(var(--muted-foreground))",
                background: "none",
                border: "none",
                cursor: "pointer",
                textDecoration: "underline",
                textUnderlineOffset: 3,
              }}
            >
              See all →
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 20,
            }}
          >
            {featured.map((item) => (
              <Card
                key={item.id}
                className="featured-card"
                style={{
                  border: "1.5px solid hsl(var(--border))",
                  borderRadius: 20,
                  overflow: "hidden",
                  boxShadow: "0 2px 16px rgba(0,0,0,0.04)",
                  cursor: "pointer",
                }}
              >
                <CardContent style={{ padding: 0 }}>
                  <div
                    style={{
                      background: `linear-gradient(135deg, ${item.bg.split(" ")[0].replace("from-", "")} 0%, ${item.bg.split(" ")[1].replace("to-", "")} 100%)`,
                      background:
                        item.id === 1
                          ? "linear-gradient(135deg, #fff7ed, #ffedd5)"
                          : item.id === 2
                            ? "linear-gradient(135deg, #fff1f2, #fce7f3)"
                            : "linear-gradient(135deg, #f0f9ff, #e0f2fe)",
                      height: 160,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "4.5rem",
                      position: "relative",
                    }}
                  >
                    {item.img}
                    <span
                      style={{
                        position: "absolute",
                        top: 12,
                        left: 12,
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "4px 10px",
                        borderRadius: 100,
                        background: "hsl(var(--card))",
                        color: "hsl(var(--foreground))",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                      }}
                    >
                      {item.tag}
                    </span>
                  </div>

                  <div style={{ padding: "16px 16px 20px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 4,
                      }}
                    >
                      <div>
                        <h3
                          style={{
                            fontSize: 15,
                            fontWeight: 600,
                            letterSpacing: "-0.01em",
                          }}
                        >
                          {item.name}
                        </h3>
                        <p
                          style={{
                            fontSize: 12,
                            color: "hsl(var(--muted-foreground))",
                            marginTop: 2,
                          }}
                        >
                          {item.restaurant}
                        </p>
                      </div>
                      <span
                        style={{
                          fontSize: 17,
                          fontWeight: 700,
                          color: "hsl(var(--foreground))",
                        }}
                      >
                        ${item.price}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginTop: 10,
                        marginBottom: 14,
                      }}
                    >
                      <span style={{ fontSize: 12, fontWeight: 600 }}>
                        ⭐ {item.rating}
                      </span>
                      <span className="divider-dot" />
                      <span
                        style={{
                          fontSize: 12,
                          color: "hsl(var(--muted-foreground))",
                        }}
                      >
                        {item.reviews} reviews
                      </span>
                      <span className="divider-dot" />
                      <span
                        style={{
                          fontSize: 12,
                          color: "hsl(var(--muted-foreground))",
                        }}
                      >
                        🕐 {item.time}
                      </span>
                    </div>

                    <Button
                      className="add-btn"
                      onClick={() => addToCart(item)}
                      style={{
                        width: "100%",
                        borderRadius: 12,
                        height: 40,
                        background: "hsl(var(--foreground))",
                        color: "hsl(var(--background))",
                        fontSize: 13,
                        fontWeight: 500,
                      }}
                    >
                      Add to cart
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* POPULAR */}
        <section className="mb-16">
          <div className="flex items-baseline justify-between mb-6">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
                Popular Near You
              </div>

              <h2 className="font-[Fraunces] text-[28px] font-semibold tracking-[-0.02em]">
                Everyone's ordering
              </h2>
            </div>

            <button
              type="button"
              className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground transition"
            >
              See all →
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {popular.map((item) => (
              <Card
                key={item.id}
                className="border-[1.5px] rounded-2xl shadow-none cursor-pointer hover:shadow-md transition"
              >
                <CardContent className="p-[14px] px-4">
                  <div className="flex items-center gap-3.5">
                    {/* Image */}
                    <div className="w-14 h-14 rounded-md bg-muted overflow-hidden shrink-0">
                      <img
                        src="https://placehold.net/400x400.png"
                        alt={item.name}
                        className="w-full h-full object-cover dark:invert"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold tracking-[-0.01em] truncate">
                        {item.name}
                      </h4>

                      <p className="text-xs text-muted-foreground mb-2 truncate">
                        {item.restaurant}
                      </p>

                      <div className="flex gap-2 items-center text-xs text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {item.time}
                      </div>
                    </div>

                    {/* Price + Add */}
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-[15px] font-bold">
                        ${item.price}
                      </span>

                      <Button
                        onClick={() => addToCart(item)}
                        className="size-8 rounded-full"
                      >
                        <Plus />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
          <Button
            className="h-12 rounded-full"
          >
            {/* Count Badge */}
            <span
              className="w-[22px] h-[22px] rounded-full bg-accent text-white 
                       flex items-center justify-center text-xs font-bold"
            >
              {cartCount}
            </span>

            <span>View cart</span>

            <span className="font-bold">${cartTotal.toFixed(2)}</span>
          </Button>
        </div>
      )}
    </div>
  );
}

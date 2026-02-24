import api from "@/lib/api";
import { create } from "zustand";

export const useProductStore = create((set, get) => {
  return {
    // ==================== PRODUCTS STATE ====================
    products: [],
    categories: [],
    isLoadingProducts: false,
    productsError: null,
    searchTerm: "",
    selectedCategory: null,
    sortBy: "latest", // latest, priceLow, priceHigh, popular

    // ==================== CART STATE ====================
    cart: [],
    isLoadingCart: false,
    cartError: null,

    // ==================== PRODUCT ACTIONS ====================

    /**
     * Fetch all public products (available items)
     */
    fetchProducts: async (filters = {}) => {
      set({ isLoadingProducts: true, productsError: null });

      try {
        const params = new URLSearchParams();

        if (filters.category) params.append("category", filters.category);
        if (filters.search) params.append("search", filters.search);
        if (filters.sortBy) params.append("sortBy", filters.sortBy);
        if (filters.isVeg !== undefined) params.append("isVeg", filters.isVeg);

        const { data } = await api.get(
          `/api/food-items?${params.toString()}`
        );

        set({
          products: data?.foodItems || [],
          isLoadingProducts: false,
        });

        return data?.foodItems || [];
      } catch (error) {
        const errorMsg =
          error.response?.data?.message || "Failed to fetch products";
        set({
          productsError: errorMsg,
          isLoadingProducts: false,
        });
        throw error;
      }
    },

    /**
     * Fetch categories (public endpoint)
     */
    fetchCategories: async () => {
      set({ isLoadingProducts: true });
      try {
        const { data } = await api.get(`/api/categories`);
        set({ categories: data?.categories || [], isLoadingProducts: false });
        return data?.categories || [];
      } catch (error) {
        set({ isLoadingProducts: false });
        // don't throw here; categories are non-critical for product listing
        return [];
      }
    },

    /**
     * Search products by name/description
     */
    searchProducts: (term) => {
      set({ searchTerm: term });
      const { products } = get();

      if (!term.trim()) {
        return products;
      }

      const filtered = products.filter(
        (product) =>
          product.name.toLowerCase().includes(term.toLowerCase()) ||
          product.description?.toLowerCase().includes(term.toLowerCase())
      );

      return filtered;
    },

    /**
     * Filter products by category
     */
    filterByCategory: (categoryId) => {
      set({ selectedCategory: categoryId });
      const { products } = get();

      if (!categoryId) {
        return products;
      }

      return products.filter(
        (product) => product.categoryId?._id === categoryId
      );
    },

    /**
     * Sort products
     */
    sortProducts: (sortBy) => {
      set({ sortBy });
      const { products } = get();

      let sorted = [...products];

      switch (sortBy) {
        case "priceLow":
          sorted.sort((a, b) => a.price - b.price);
          break;
        case "priceHigh":
          sorted.sort((a, b) => b.price - a.price);
          break;
        case "popular":
          sorted.sort((a, b) => (b.orders || 0) - (a.orders || 0));
          break;
        case "latest":
        default:
          sorted.sort(
            (a, b) =>
              new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
          );
          break;
      }

      return sorted;
    },

    /**
     * Get all available products
     */
    getAvailableProducts: () => {
      const { products } = get();
      return products.filter((p) => p.isAvailable !== false);
    },

    /**
     * Get single product by ID
     */
    getProductById: (productId) => {
      const { products } = get();
      return products.find((p) => p._id === productId);
    },

    // ==================== CART ACTIONS ====================

    /**
     * Add item to cart
     */
    addToCart: (productId, quantity = 1) => {
      set({ cartError: null });

      const { cart, products } = get();
      const product = products.find((p) => p._id === productId);

      if (!product) {
        set({ cartError: "Product not found" });
        return false;
      }

      if (!product.isAvailable) {
        set({ cartError: "This product is currently unavailable" });
        return false;
      }

      // Check if item already exists in cart
      const existingItem = cart.find((item) => item._id === productId);

      let updatedCart;
      if (existingItem) {
        // Update quantity if item exists
        updatedCart = cart.map((item) =>
          item._id === productId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        // Add new item to cart
        updatedCart = [
          ...cart,
          {
            ...product,
            _id: product._id,
            quantity,
            addedAt: new Date(),
          },
        ];
      }

      set({ cart: updatedCart });
      return true;
    },

    /**
     * Remove item from cart
     */
    removeFromCart: (productId) => {
      const { cart } = get();
      const updatedCart = cart.filter((item) => item._id !== productId);
      set({ cart: updatedCart, cartError: null });
    },

    /**
     * Update cart item quantity
     */
    updateCartQuantity: (productId, quantity) => {
      if (quantity < 1) {
        get().removeFromCart(productId);
        return;
      }

      const { cart } = get();
      const updatedCart = cart.map((item) =>
        item._id === productId ? { ...item, quantity } : item
      );

      set({ cart: updatedCart, cartError: null });
    },

    /**
     * Clear entire cart
     */
    clearCart: () => {
      set({ cart: [], cartError: null });
    },

    /**
     * Get cart items count
     */
    getCartCount: () => {
      const { cart } = get();
      return cart.reduce((total, item) => total + item.quantity, 0);
    },

    /**
     * Get cart total price
     */
    getCartTotal: () => {
      const { cart } = get();
      return cart.reduce((total, item) => total + item.price * item.quantity, 0);
    },

    /**
     * Get cart items with calculations
     */
    getCart: () => {
      const { cart } = get();
      const subtotal = get().getCartTotal();
      const itemCount = get().getCartCount();

      return {
        items: cart,
        subtotal,
        itemCount,
        // Add tax (if needed), delivery, etc.
        tax: Math.round((subtotal * 0.05) * 100) / 100, // 5% tax
        total: Math.round((subtotal + (subtotal * 0.05)) * 100) / 100,
      };
    },

    /**
     * Check if product is in cart
     */
    isInCart: (productId) => {
      const { cart } = get();
      return cart.some((item) => item._id === productId);
    },

    /**
     * Get cart item quantity
     */
    getCartItemQuantity: (productId) => {
      const { cart } = get();
      const item = cart.find((c) => c._id === productId);
      return item?.quantity || 0;
    },
  };
});

export default useProductStore;

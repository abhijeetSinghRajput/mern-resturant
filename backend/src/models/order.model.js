import mongoose from "mongoose";

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

const orderItemSchema = new mongoose.Schema(
  {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MenuItem",
      required: true,
    },
    name: { type: String, required: true },   // snapshot
    price: { type: Number, required: true },  // snapshot
    quantity: { type: Number, required: true, min: 1 },
    total: { type: Number, required: true },  // price * quantity
  },
  { _id: false }
);

const pricingSchema = new mongoose.Schema(
  {
    subTotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    method: {
      type: String,
      enum: ["online", "cod"],
      required: true,
    },
    provider: { type: String, default: "razorpay" }, // razorpay | stripe | etc.
    transactionId: { type: String, default: null },  // Razorpay payment_id
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    paidAt: { type: Date, default: null },

    // Razorpay-specific — needed for verification
    razorpayOrderId: { type: String, default: null },
    razorpaySignature: { type: String, default: null },
  },
  { _id: false }
);

// ─── Root schema ──────────────────────────────────────────────────────────────

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    orderType: {
      type: String,
      enum: ["dine_in", "take_away", "delivery"],
      required: true,
    },

    items: {
      type: [orderItemSchema],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: "Order must have at least one item.",
      },
    },

    pricing: { type: pricingSchema, required: true },

    // Required only for delivery orders
    address: {
      type: String,
      default: null,
    },

    // Required only for dine_in orders
    dineInTable: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: [
        "placed",
        "confirmed",
        "preparing",
        "ready_for_pickup",
        "out_for_delivery",
        "completed",
        "cancelled",
      ],
      default: "placed",
      index: true,
    },

    // ── Cancellation ──────────────────────────────────────────────────────────
    cancelledAt: { type: Date, default: null },
    cancellationReason: { type: String, default: null },

    // ── Payment (embedded) ────────────────────────────────────────────────────
    payment: { type: paymentSchema, required: true },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

// ─── Compound index for common admin queries ──────────────────────────────────
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

const Order = mongoose.model("Order", orderSchema);

export default Order;
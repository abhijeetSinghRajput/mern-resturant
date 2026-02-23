import mongoose from "mongoose";
import Order from "../models/order.model.js";
import razorpay from "../config/razorpay.config.js";
import { initiateRefund } from "./payment.service.js";

// ─── Constants ────────────────────────────────────────────────────────────────

// Statuses that are terminal — no further transitions allowed
const TERMINAL_STATUSES = new Set(["completed", "cancelled"]);

// Legal forward-only status transitions
// Key = current status → Value = set of statuses it may move to
const ALLOWED_TRANSITIONS = {
  placed:            new Set(["confirmed", "cancelled"]),
  confirmed:         new Set(["preparing", "cancelled"]),
  preparing:         new Set(["ready_for_pickup"]),
  ready_for_pickup:  new Set(["out_for_delivery", "completed"]),
  out_for_delivery:  new Set(["completed"]),
  completed:         new Set(),
  cancelled:         new Set(),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Compute items array + pricing from raw cart input.
 * Expects each item to already carry { name, price } snapshots.
 * Returns { items, pricing } ready to persist.
 */
const buildItemsAndPricing = (rawItems, discountAmount = 0) => {
  const items = rawItems.map((item) => {
    const total = parseFloat((item.price * item.quantity).toFixed(2));
    return {
      itemId: item.itemId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      total,
    };
  });

  const subTotal = parseFloat(
    items.reduce((sum, i) => sum + i.total, 0).toFixed(2)
  );
  const discount = parseFloat((discountAmount || 0).toFixed(2));
  const totalAmount = parseFloat(Math.max(0, subTotal - discount).toFixed(2));

  return { items, pricing: { subTotal, discount, totalAmount } };
};

/**
 * Create a Razorpay order for online payments.
 * Razorpay expects amount in the smallest currency unit (paise for INR).
 */
const createRazorpayOrder = async (totalAmount, currency, receiptId) => {
  const amountInPaise = Math.round(totalAmount * 100);

  const rzpOrder = await razorpay.orders.create({
    amount: amountInPaise,
    currency,
    receipt: String(receiptId),
    payment_capture: 1, // auto-capture on payment success
  });

  return rzpOrder;
};

/**
 * Validate order-type-specific required fields before persisting.
 */
const validateOrderTypeFields = (orderType, address, dineInTable) => {
  if (orderType === "delivery" && !address?.trim()) {
    throw Object.assign(new Error("Delivery orders require a delivery address."), {
      statusCode: 400,
    });
  }
  if (orderType === "dine_in" && !dineInTable?.trim()) {
    throw Object.assign(new Error("Dine-in orders require a table identifier."), {
      statusCode: 400,
    });
  }
};

// ─── Service Functions ────────────────────────────────────────────────────────

/**
 * createOrder()
 *
 * Handles both COD and online payment flows.
 *
 * For COD   → order is created with paymentStatus "pending", no Razorpay call.
 * For online → a Razorpay order is created first; its ID is embedded so the
 *              client can open the Razorpay checkout. Payment is verified later
 *              via the payment service (Stage 3).
 *
 * @param {Object} params
 * @param {string}   params.userId
 * @param {string}   params.orderType     "dine_in" | "take_away" | "delivery"
 * @param {Array}    params.items         Raw cart items with name/price snapshots
 * @param {number}   [params.discount]    Optional discount amount in INR
 * @param {string}   [params.address]     Required for delivery
 * @param {string}   [params.dineInTable] Required for dine_in
 * @param {string}   params.paymentMethod "online" | "cod"
 * @param {string}   [params.currency]    Defaults to "INR"
 *
 * @returns {{ order: Object, razorpayOrder: Object|null }}
 */
const createOrder = async ({
  userId,
  orderType,
  items: rawItems,
  discount,
  address,
  dineInTable,
  paymentMethod,
  currency = "INR",
}) => {
  // ── Validate ────────────────────────────────────────────────────────────────
  if (!userId) throw Object.assign(new Error("userId is required."), { statusCode: 400 });
  if (!rawItems?.length) throw Object.assign(new Error("Order must contain at least one item."), { statusCode: 400 });
  if (!["online", "cod"].includes(paymentMethod)) {
    throw Object.assign(new Error("Invalid payment method. Use 'online' or 'cod'."), { statusCode: 400 });
  }

  validateOrderTypeFields(orderType, address, dineInTable);

  // ── Build items + pricing ───────────────────────────────────────────────────
  const { items, pricing } = buildItemsAndPricing(rawItems, discount);

  // ── COD flow ────────────────────────────────────────────────────────────────
  if (paymentMethod === "cod") {
    const order = await Order.create({
      userId,
      orderType,
      items,
      pricing,
      address: address || null,
      dineInTable: dineInTable || null,
      payment: {
        amount: pricing.totalAmount,
        currency,
        method: "cod",
        provider: null,
        paymentStatus: "pending", // paid on delivery
      },
    });

    // TODO: emit real-time notification — new order placed (cod)

    return { order, razorpayOrder: null };
  }

  // ── Online flow (Razorpay) ──────────────────────────────────────────────────
  // We need a temporary receipt ID before the DB _id exists.
  // Use a short timestamp-based receipt; Razorpay receipt max length is 40 chars.
  const receipt = `rcpt_${Date.now()}`;

  const rzpOrder = await createRazorpayOrder(pricing.totalAmount, currency, receipt);

  const order = await Order.create({
    userId,
    orderType,
    items,
    pricing,
    address: address || null,
    dineInTable: dineInTable || null,
    payment: {
      amount: pricing.totalAmount,
      currency,
      method: "online",
      provider: "razorpay",
      paymentStatus: "pending",
      razorpayOrderId: rzpOrder.id, // client needs this to open checkout
    },
  });

  // TODO: emit real-time notification — new order placed (online, awaiting payment)

  return { order, razorpayOrder: rzpOrder };
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * getOrderById()
 *
 * Fetches a single order. Optionally scopes to a userId for user-facing
 * endpoints (prevents users from fetching other users' orders).
 *
 * @param {string}  orderId
 * @param {string}  [scopedUserId]  If provided, enforces ownership check.
 * @returns {Object} order document
 */
const getOrderById = async (orderId, scopedUserId = null) => {
  if (!mongoose.isValidObjectId(orderId)) {
    throw Object.assign(new Error("Invalid order ID."), { statusCode: 400 });
  }

  const query = { _id: orderId };
  if (scopedUserId) query.userId = scopedUserId;

  const order = await Order.findOne(query).lean();

  if (!order) {
    throw Object.assign(new Error("Order not found."), { statusCode: 404 });
  }

  return order;
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * getUserOrders()
 *
 * Paginated list of orders for a specific user, newest first.
 *
 * @param {string}  userId
 * @param {Object}  [options]
 * @param {number}  [options.page=1]
 * @param {number}  [options.limit=10]
 * @param {string}  [options.status]   Optional status filter
 * @returns {{ orders: Array, pagination: Object }}
 */
const getUserOrders = async (userId, { page = 1, limit = 10, status } = {}) => {
  if (!userId) throw Object.assign(new Error("userId is required."), { statusCode: 400 });

  const query = { userId };
  if (status) query.status = status;

  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Order.countDocuments(query),
  ]);

  return {
    orders,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    },
  };
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * updateOrderStatus()
 *
 * Advances an order through its lifecycle. Enforces the allowed transition
 * table — no arbitrary status jumps.
 *
 * @param {string} orderId
 * @param {string} newStatus
 * @returns {Object} updated order document
 */
const updateOrderStatus = async (orderId, newStatus) => {
  if (!mongoose.isValidObjectId(orderId)) {
    throw Object.assign(new Error("Invalid order ID."), { statusCode: 400 });
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw Object.assign(new Error("Order not found."), { statusCode: 404 });
  }

  const currentStatus = order.status;

  if (TERMINAL_STATUSES.has(currentStatus)) {
    throw Object.assign(
      new Error(`Order is already ${currentStatus}. No further updates are allowed.`),
      { statusCode: 409 }
    );
  }

  if (!ALLOWED_TRANSITIONS[currentStatus]?.has(newStatus)) {
    throw Object.assign(
      new Error(
        `Invalid transition: "${currentStatus}" → "${newStatus}". ` +
          `Allowed next statuses: [${[...ALLOWED_TRANSITIONS[currentStatus]].join(", ")}].`
      ),
      { statusCode: 422 }
    );
  }

  order.status = newStatus;
  await order.save();

  // TODO: emit real-time notification — order status changed

  return order.toObject();
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * cancelOrder()
 *
 * Cancels an order if it is still in a cancellable state.
 * Only "placed" and "confirmed" orders can be cancelled — once the kitchen
 * starts preparing, cancellation must go through an admin override.
 *
 * For online orders that were already paid, refund logic lives in the
 * payment service (Stage 3) and is triggered from here once implemented.
 *
 * @param {string}  orderId
 * @param {string}  reason
 * @param {string}  [scopedUserId]  If provided, enforces ownership check.
 * @returns {Object} cancelled order document
 */
const cancelOrder = async (orderId, reason, scopedUserId = null) => {
  if (!mongoose.isValidObjectId(orderId)) {
    throw Object.assign(new Error("Invalid order ID."), { statusCode: 400 });
  }
  if (!reason?.trim()) {
    throw Object.assign(new Error("Cancellation reason is required."), { statusCode: 400 });
  }

  const query = { _id: orderId };
  if (scopedUserId) query.userId = scopedUserId;

  const order = await Order.findOne(query);
  if (!order) {
    throw Object.assign(new Error("Order not found."), { statusCode: 404 });
  }

  if (TERMINAL_STATUSES.has(order.status)) {
    throw Object.assign(
      new Error(`Order is already ${order.status} and cannot be cancelled.`),
      { statusCode: 409 }
    );
  }

  const CANCELLABLE_STATUSES = new Set(["placed", "confirmed"]);
  if (!CANCELLABLE_STATUSES.has(order.status)) {
    throw Object.assign(
      new Error(
        `Order cannot be cancelled at status "${order.status}". ` +
          `Only placed or confirmed orders can be self-cancelled.`
      ),
      { statusCode: 422 }
    );
  }

  order.status = "cancelled";
  order.cancelledAt = new Date();
  order.cancellationReason = reason.trim();

  // If the order was online and already paid → trigger refund in Stage 3
  if (
    order.payment.method === "online" &&
    order.payment.paymentStatus === "paid"
  ) {
    await initiateRefund(order, reason.trim());
    // initiateRefund saves paymentStatus → "refunded" internally;
    // cancellation fields are persisted by the save() below.
  }

  await order.save();

  // TODO: emit real-time notification — order cancelled

  return order.toObject();
};

// ─────────────────────────────────────────────────────────────────────────────

export {
  createOrder,
  getOrderById,
  getUserOrders,
  updateOrderStatus,
  cancelOrder,
};
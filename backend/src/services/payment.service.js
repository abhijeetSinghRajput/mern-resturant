import crypto from "crypto";
import mongoose from "mongoose";
import Order from "../models/order.model.js";
import razorpay from "../config/razorpay.config.js";

// ─── Constants ────────────────────────────────────────────────────────────────

const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

// ─── Private Helpers ──────────────────────────────────────────────────────────

/**
 * Verify Razorpay HMAC-SHA256 payment signature.
 *
 * Razorpay signs the payload as:
 *   HMAC_SHA256( razorpay_order_id + "|" + razorpay_payment_id, key_secret )
 *
 * @returns {boolean}
 */
const isValidRazorpaySignature = ({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}) => {
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  // Constant-time comparison — prevents timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(razorpaySignature, "hex")
  );
};

/**
 * Verify Razorpay webhook HMAC-SHA256 signature.
 *
 * Razorpay sends X-Razorpay-Signature in the request headers.
 * Payload is the raw request body (must be the raw Buffer/string, NOT parsed JSON).
 *
 * @param {string|Buffer} rawBody   - Raw request body from Express
 * @param {string}        signature - Value of X-Razorpay-Signature header
 * @returns {boolean}
 */
const isValidWebhookSignature = (rawBody, signature) => {
  const expected = crypto
    .createHmac("sha256", RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(signature, "hex")
  );
};

/**
 * Fetch the Razorpay payment object directly from Razorpay's API.
 * Used as a fallback / source-of-truth after signature verification.
 */
const fetchRazorpayPayment = async (paymentId) => {
  return razorpay.payments.fetch(paymentId);
};

// ─── Service Functions ────────────────────────────────────────────────────────

/**
 * verifyAndCapturePayment()
 *
 * Called after the client completes Razorpay checkout.
 * The frontend receives { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 * from the Razorpay callback and forwards them to our backend.
 *
 * Flow:
 *  1. Load the order by razorpayOrderId — ensures the payment belongs to a real order
 *  2. Idempotency check — if already paid, return immediately (safe retry)
 *  3. Verify HMAC signature — cryptographic proof that Razorpay sent this
 *  4. Fetch payment from Razorpay API — confirm amount, currency, status
 *  5. Persist — mark order payment as "paid", store transactionId + signature + paidAt
 *  6. Advance order status → "confirmed"
 *
 * @param {Object} params
 * @param {string} params.razorpayOrderId   - from Razorpay callback
 * @param {string} params.razorpayPaymentId - from Razorpay callback
 * @param {string} params.razorpaySignature - from Razorpay callback
 * @param {string} [params.scopedUserId]    - if provided, enforces ownership
 *
 * @returns {{ order: Object, payment: Object }}
 */
const verifyAndCapturePayment = async ({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
  scopedUserId = null,
}) => {
  // ── 1. Validate inputs ──────────────────────────────────────────────────────
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    throw Object.assign(
      new Error("razorpayOrderId, razorpayPaymentId and razorpaySignature are all required."),
      { statusCode: 400 }
    );
  }

  // ── 2. Find the order by its embedded razorpayOrderId ───────────────────────
  const query = { "payment.razorpayOrderId": razorpayOrderId };
  if (scopedUserId) query.userId = scopedUserId;

  const order = await Order.findOne(query);

  if (!order) {
    throw Object.assign(
      new Error("No order found for this Razorpay order ID."),
      { statusCode: 404 }
    );
  }

  // ── 3. Idempotency — already paid → return early, no double-processing ──────
  if (order.payment.paymentStatus === "paid") {
    return { order: order.toObject(), alreadyPaid: true };
  }

  // ── 4. Guard — must be an online pending order ──────────────────────────────
  if (order.payment.method !== "online") {
    throw Object.assign(
      new Error("This order is not an online payment order."),
      { statusCode: 409 }
    );
  }

  if (order.payment.paymentStatus === "failed") {
    throw Object.assign(
      new Error("This payment has already been marked as failed. Please create a new order."),
      { statusCode: 409 }
    );
  }

  // ── 5. Verify HMAC-SHA256 signature ─────────────────────────────────────────
  let signatureValid = false;
  try {
    signatureValid = isValidRazorpaySignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });
  } catch {
    // Buffer comparison can throw if hex strings are malformed
    signatureValid = false;
  }

  if (!signatureValid) {
    // Mark payment as failed so user can't retry with a tampered signature
    order.payment.paymentStatus = "failed";
    await order.save();

    throw Object.assign(
      new Error("Payment signature verification failed. Possible tampering detected."),
      { statusCode: 400 }
    );
  }

  // ── 6. Fetch from Razorpay API — verify amount, currency, captured status ───
  const rzpPayment = await fetchRazorpayPayment(razorpayPaymentId);

  const expectedAmountInPaise = Math.round(order.payment.amount * 100);

  if (rzpPayment.amount !== expectedAmountInPaise) {
    order.payment.paymentStatus = "failed";
    await order.save();

    throw Object.assign(
      new Error(
        `Amount mismatch: expected ${expectedAmountInPaise} paise, ` +
          `Razorpay reports ${rzpPayment.amount} paise.`
      ),
      { statusCode: 422 }
    );
  }

  if (rzpPayment.currency !== order.payment.currency) {
    order.payment.paymentStatus = "failed";
    await order.save();

    throw Object.assign(
      new Error(`Currency mismatch: expected ${order.payment.currency}, got ${rzpPayment.currency}.`),
      { statusCode: 422 }
    );
  }

  if (rzpPayment.status !== "captured") {
    // Payment exists but not yet captured (edge case with manual capture mode)
    throw Object.assign(
      new Error(`Payment is in "${rzpPayment.status}" state. Expected "captured".`),
      { statusCode: 422 }
    );
  }

  // ── 7. Persist — atomic update of the payment sub-document ──────────────────
  order.payment.paymentStatus = "paid";
  order.payment.transactionId = razorpayPaymentId;
  order.payment.razorpaySignature = razorpaySignature;
  order.payment.paidAt = new Date();

  // Advance order status to confirmed on successful payment
  order.status = "confirmed";

  await order.save();

  // TODO: emit real-time notification — payment successful, order confirmed

  return { order: order.toObject(), alreadyPaid: false };
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * confirmCodPayment()
 *
 * Marks a COD order as paid when the delivery agent collects cash.
 * Only callable by admin/staff — not exposed to users.
 *
 * @param {string} orderId
 * @returns {Object} updated order
 */
const confirmCodPayment = async (orderId) => {
  if (!mongoose.isValidObjectId(orderId)) {
    throw Object.assign(new Error("Invalid order ID."), { statusCode: 400 });
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw Object.assign(new Error("Order not found."), { statusCode: 404 });
  }

  if (order.payment.method !== "cod") {
    throw Object.assign(
      new Error("This is not a COD order."),
      { statusCode: 409 }
    );
  }

  // Idempotency — already confirmed
  if (order.payment.paymentStatus === "paid") {
    return order.toObject();
  }

  if (order.status !== "completed") {
    throw Object.assign(
      new Error("COD payment can only be confirmed after the order is completed."),
      { statusCode: 422 }
    );
  }

  order.payment.paymentStatus = "paid";
  order.payment.paidAt = new Date();
  await order.save();

  // TODO: emit real-time notification — COD payment confirmed

  return order.toObject();
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * initiateRefund()
 *
 * Initiates a full refund via Razorpay for a paid online order.
 * Called from cancelOrder() in order.service.js when a paid order is cancelled.
 *
 * Razorpay refunds are async — the refund is initiated here and its completion
 * is confirmed via the webhook ("refund.processed" event).
 *
 * @param {Object} order - Mongoose document (not plain object)
 * @param {string} [reason] - Optional reason string
 * @returns {{ order: Object, refund: Object }}
 */
const initiateRefund = async (order, reason = "Order cancelled by customer") => {
  if (!order?.payment?.transactionId) {
    throw Object.assign(
      new Error("No transactionId found. Cannot initiate refund."),
      { statusCode: 422 }
    );
  }

  if (order.payment.paymentStatus !== "paid") {
    throw Object.assign(
      new Error("Refund can only be initiated for paid orders."),
      { statusCode: 409 }
    );
  }

  // Idempotency — already refunded
  if (order.payment.paymentStatus === "refunded") {
    return { order: order.toObject(), refund: null, alreadyRefunded: true };
  }

  const amountInPaise = Math.round(order.payment.amount * 100);

  // Razorpay refund API
  const refund = await razorpay.payments.refund(order.payment.transactionId, {
    amount: amountInPaise, // full refund
    notes: {
      orderId: String(order._id),
      reason,
    },
  });

  // Mark as refunded immediately (Razorpay instant refunds) or
  // leave as "paid" and wait for webhook if using normal refunds.
  // We optimistically mark as "refunded" here since the refund is initiated.
  order.payment.paymentStatus = "refunded";
  await order.save();

  // TODO: emit real-time notification — refund initiated

  return { order: order.toObject(), refund, alreadyRefunded: false };
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * handleRazorpayWebhook()
 *
 * Processes inbound Razorpay webhook events.
 * Express must pass the RAW body (Buffer) — not the parsed JSON body —
 * for signature verification to work.
 *
 * Register these events in the Razorpay dashboard:
 *   - payment.captured
 *   - payment.failed
 *   - refund.processed
 *
 * Webhook events act as a reliable fallback for cases where the client-side
 * callback (verifyAndCapturePayment) didn't fire — e.g. user closed the tab.
 *
 * @param {Buffer|string} rawBody   - req.body before JSON parsing (use express.raw())
 * @param {string}        signature - req.headers["x-razorpay-signature"]
 * @returns {{ processed: boolean, event: string }}
 */
const handleRazorpayWebhook = async (rawBody, signature) => {
  // ── 1. Verify webhook authenticity ─────────────────────────────────────────
  if (!RAZORPAY_WEBHOOK_SECRET) {
    throw Object.assign(
      new Error("RAZORPAY_WEBHOOK_SECRET is not configured."),
      { statusCode: 500 }
    );
  }

  let signatureValid = false;
  try {
    signatureValid = isValidWebhookSignature(rawBody, signature);
  } catch {
    signatureValid = false;
  }

  if (!signatureValid) {
    throw Object.assign(
      new Error("Invalid webhook signature."),
      { statusCode: 400 }
    );
  }

  // ── 2. Parse event ──────────────────────────────────────────────────────────
  const event = JSON.parse(rawBody.toString());
  const eventType = event.event;
  const payload = event.payload;

  // ── 3. Route by event type ──────────────────────────────────────────────────
  switch (eventType) {

    // ── payment.captured ───────────────────────────────────────────────────────
    // Fires when Razorpay auto-captures payment (payment_capture: 1 on order create).
    // Acts as the reliable fallback if the client callback didn't reach us.
    case "payment.captured": {
      const rzpPayment = payload.payment.entity;
      const rzpOrderId = rzpPayment.order_id;
      const rzpPaymentId = rzpPayment.id;

      const order = await Order.findOne({ "payment.razorpayOrderId": rzpOrderId });

      if (!order) {
        // Possibly from a test or unrelated integration — log and ignore
        return { processed: false, event: eventType, reason: "Order not found" };
      }

      // Idempotency — already processed by client callback
      if (order.payment.paymentStatus === "paid") {
        return { processed: true, event: eventType, alreadyPaid: true };
      }

      order.payment.paymentStatus = "paid";
      order.payment.transactionId = rzpPaymentId;
      order.payment.paidAt = new Date(rzpPayment.created_at * 1000); // Unix → Date
      order.status = "confirmed";
      await order.save();

      // TODO: emit real-time notification — payment captured via webhook

      return { processed: true, event: eventType };
    }

    // ── payment.failed ─────────────────────────────────────────────────────────
    case "payment.failed": {
      const rzpPayment = payload.payment.entity;
      const rzpOrderId = rzpPayment.order_id;

      const order = await Order.findOne({ "payment.razorpayOrderId": rzpOrderId });

      if (!order || order.payment.paymentStatus === "paid") {
        // Don't override a successfully paid order with a failed event
        return { processed: false, event: eventType, reason: "Order not found or already paid" };
      }

      order.payment.paymentStatus = "failed";
      await order.save();

      // TODO: emit real-time notification — payment failed

      return { processed: true, event: eventType };
    }

    // ── refund.processed ───────────────────────────────────────────────────────
    case "refund.processed": {
      const rzpRefund = payload.refund.entity;
      const rzpPaymentId = rzpRefund.payment_id;

      const order = await Order.findOne({ "payment.transactionId": rzpPaymentId });

      if (!order) {
        return { processed: false, event: eventType, reason: "Order not found" };
      }

      // Already marked refunded (optimistic update in initiateRefund)
      if (order.payment.paymentStatus === "refunded") {
        return { processed: true, event: eventType, alreadyRefunded: true };
      }

      order.payment.paymentStatus = "refunded";
      await order.save();

      // TODO: emit real-time notification — refund confirmed

      return { processed: true, event: eventType };
    }

    // ── Unhandled event types ──────────────────────────────────────────────────
    default:
      return { processed: false, event: eventType, reason: "Unhandled event type" };
  }
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * getPaymentStatus()
 *
 * Returns the current payment state of an order.
 * Thin read helper for controllers — no Razorpay API call.
 *
 * @param {string}  orderId
 * @param {string}  [scopedUserId] - enforce ownership for user-facing routes
 * @returns {Object} payment sub-document
 */
const getPaymentStatus = async (orderId, scopedUserId = null) => {
  if (!mongoose.isValidObjectId(orderId)) {
    throw Object.assign(new Error("Invalid order ID."), { statusCode: 400 });
  }

  const query = { _id: orderId };
  if (scopedUserId) query.userId = scopedUserId;

  const order = await Order.findOne(query).select("payment status").lean();

  if (!order) {
    throw Object.assign(new Error("Order not found."), { statusCode: 404 });
  }

  return {
    orderId: order._id,
    orderStatus: order.status,
    payment: order.payment,
  };
};

// ─────────────────────────────────────────────────────────────────────────────

export {
  verifyAndCapturePayment,
  confirmCodPayment,
  initiateRefund,
  handleRazorpayWebhook,
  getPaymentStatus,
};
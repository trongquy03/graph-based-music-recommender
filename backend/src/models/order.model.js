import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    orderCode: { type: Number, required: true, unique: true },
    clerkId: { type: String, required: true },
    planId: { type: String, required: true },
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", orderSchema);

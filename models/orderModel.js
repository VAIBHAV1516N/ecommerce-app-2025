import mongoose from "mongoose";
const { Schema } = mongoose;

const OrderProductSchema = new Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  name: { type: String },
  price: { type: Number },
  quantity: { type: Number, default: 1 },
  lineTotal: { type: String }, // or Number
});

const orderSchema = new Schema({
  products: [OrderProductSchema],
  payment: {
    transactionId: String,
    amount: String,
    status: String,
  },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  clientOrderId: { type: String, index: true, default: null },
  status: {
      type: String,
      default: "Not Process",
      enum: ["Not Process", "Processing", "Shipped", "deliverd", "cancel"],
    },
}, { timestamps: true });

export default mongoose.model("Order", orderSchema);

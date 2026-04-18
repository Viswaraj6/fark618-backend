const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const app = express();

app.use(express.json());
app.use(cors({ origin: "*" }));

// 🔐 ADMIN
function checkAdmin(req, res, next) {
  if (req.headers.admin !== "fark618") {
    return res.status(401).json({ error: "Unauthorized ❌" });
  }
  next();
}

// ✅ DB
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch(err => console.log(err));

// 💳 Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// 📦 PRODUCT
const Product = mongoose.model("Product", {
  name: String,
  price: Number,
  stock: Number,
  sizes: [String],
  image: String
});

// 🧾 ORDER
const Order = mongoose.model("Order", {
  user: String,
  name: String,
  phone: String,
  address: String,
  products: Array,
  total: Number,
  paymentId: String,
  status: String,
  date: { type: Date, default: Date.now }
});

// 🟢 ROOT
app.get("/", (req, res) => {
  res.send("API Running 🚀");
});


// 🔥 CREATE ORDER (Razorpay)
app.post("/create-order", async (req, res) => {
  try {
    const options = {
      amount: req.body.amount * 100,
      currency: "INR"
    };

    const order = await razorpay.orders.create(options);
    res.json(order);

  } catch (err) {
    res.status(500).json({ error: "Razorpay error ❌" });
  }
});


// 🔒 VERIFY PAYMENT
app.post("/verify-payment", async (req, res) => {
  try {

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expected === razorpay_signature) {
      res.json({ success: true });
    } else {
      res.status(400).json({ success: false });
    }

  } catch (err) {
    res.status(500).json({ error: "Verification failed ❌" });
  }
});


// 🛒 SAVE ORDER
app.post("/order", async (req, res) => {
  try {

    const order = new Order(req.body);
    await order.save();

    res.json({ message: "Order saved ✅" });

  } catch (err) {
    res.status(500).json({ error: "Order failed ❌" });
  }
});


// 📦 GET ORDERS
app.get("/orders", async (req, res) => {
  const data = await Order.find().sort({ date: -1 });
  res.json(data);
});


// 🚀 START
app.listen(process.env.PORT || 5000, () => {
  console.log("Server running 🚀");
});

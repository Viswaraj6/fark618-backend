const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cors({ origin: "*" }));

/* 🔐 ADMIN LOGIN */
const ADMIN_USER = "admin";
const ADMIN_PASS = "Vivin@14";
const JWT_SECRET = "fark-secret";

app.post("/admin-login", (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "1d" });
    res.json({ token });
  } else {
    res.status(401).json({ error: "Invalid login ❌" });
  }
});

/* 🔐 ADMIN CHECK */
function checkAdmin(req, res, next) {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ success: false, message: "No token ❌" });
  }

  try {
    jwt.verify(token.replace("Bearer ", ""), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ success: false, message: "Invalid token ❌" });
  }
}

/* ✅ DB */
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch(err => console.log(err));

/* 💳 RAZORPAY */
let razorpay = null;

if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
  console.log("Razorpay Initialized ✅");
} else {
  console.log("⚠ Razorpay keys missing");
}

/* 📦 PRODUCT */
const Product = mongoose.model("Product", {
  name: String,
  price: Number,
  stock: Number,
  sizes: [String],
  image: String,
  video: String   // 🔥 ADD THIS
});
/* 🎬 GLOBAL VIDEO */
const Video = mongoose.model("Video", {
  url: String
});
/* 🧾 ORDER */
const Order = mongoose.model("Order", {
  user: String,
  name: String,
  phone: String,
  address: String,
  products: Array,
  total: Number,
  paymentId: String,
  status: { type: String, default: "Pending" },
  date: { type: Date, default: Date.now }
});
// 🔥 BANNER MODEL
const Banner = mongoose.model("Banner", {
  type: String, // "video" or "slider"
  videoUrl: String,
  images: [String]
});

// SAVE BANNER
app.post("/banner", async (req, res) => {
  await Banner.deleteMany();

  const banner = new Banner(req.body);
  await banner.save();

  res.json({ success: true });
});

// GET BANNER
app.get("/banner", async (req, res) => {
  const data = await Banner.findOne();
  res.json(data || {});
});
/* ================= PRODUCT ================= */

/* ADD PRODUCT (ADMIN ONLY) */
app.post("/add-product", checkAdmin, async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();

    res.json({
      success: true,
      message: "Product Added ✅"
    });

  } catch {
    res.status(500).json({
      success: false,
      message: "Add product failed ❌"
    });
  }
});

/* GET PRODUCTS */
app.get("/products", async (req, res) => {
  const data = await Product.find().sort({ _id: -1 });
  res.json(data);
});

/* DELETE PRODUCT (FIXED) */
app.delete("/products/:id", checkAdmin, async (req, res) => {
  try {

    const deleted = await Product.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Product not found ❌"
      });
    }

    res.json({
      success: true,
      message: "Deleted successfully ✅"
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Delete error ❌"
    });
  }
});

/* ================= PAYMENT ================= */

app.post("/create-order", async (req, res) => {
  if (!razorpay) {
    return res.status(500).json({ error: "Payment not configured ❌" });
  }

  try {
    const order = await razorpay.orders.create({
      amount: req.body.amount * 100,
      currency: "INR"
    });

    res.json(order);
  } catch {
    res.status(500).json({ error: "Razorpay error ❌" });
  }
});

app.post("/verify-payment", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
      .update(body)
      .digest("hex");

    if (expected === razorpay_signature) {
      res.json({ success: true });
    } else {
      res.status(400).json({ success: false });
    }
  } catch {
    res.status(500).json({ error: "Verification failed ❌" });
  }
});

/* ================= ORDERS ================= */

app.post("/order", async (req, res) => {
  try {
    const order = new Order(req.body);
    await order.save();

    res.json({ success: true });

  } catch {
    res.status(500).json({ error: "Order failed ❌" });
  }
});

app.get("/orders", async (req, res) => {
  const data = await Order.find().sort({ date: -1 });
  res.json(data);
});
/* SAVE / REPLACE VIDEO */
app.post("/video", checkAdmin, async (req, res) => {
  try {
    await Video.deleteMany();
    const video = new Video({ url: req.body.url });
    await video.save();
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Video save failed ❌" });
  }
});

/* GET VIDEO */
app.get("/video", async (req, res) => {
  const v = await Video.findOne();
  res.json(v || {});
});
app.put("/orders/:id", checkAdmin, async (req, res) => {
  try {
    await Order.findByIdAndUpdate(req.params.id, { status: req.body.status });

    res.json({
      success: true,
      message: "Updated ✅"
    });

  } catch {
    res.status(500).json({ error: "Update failed ❌" });
  }
});

/* ================= START ================= */

app.listen(process.env.PORT || 5000, () => {
  console.log("Server running 🚀");
});

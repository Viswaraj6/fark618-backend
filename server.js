const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// 🔥 Middleware
app.use(express.json());
app.use(cors({
  origin: "*"
}));

// ✅ MongoDB Connect
const MONGO_URL = process.env.MONGO_URL;

mongoose.connect(MONGO_URL)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch(err => console.log("Mongo Error ❌", err));


// 📦 Product Schema
const Product = mongoose.model("Product", {
  name: String,
  price: Number,
  stock: Number,
  image: String
});


// 🧾 Order Schema (🔥 FIXED WITH USER)
const Order = mongoose.model("Order", {
  user: String, // ✅ முக்கியம்
  products: Array,
  total: Number,
  status: { type: String, default: "Pending" },
  date: { type: Date, default: Date.now }
});


// 🟢 ROOT
app.get("/", (req, res) => {
  res.send("FARK618 API Running 🚀");
});


// ➕ ADD PRODUCT
app.post("/add-product", async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.json(product);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error adding product");
  }
});


// 📥 GET PRODUCTS
app.get("/products", async (req, res) => {
  try {
    const data = await Product.find();
    res.json(data);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error fetching products");
  }
});


// ✏️ UPDATE PRODUCT
app.put("/products/:id", async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, req.body);
    res.send("Updated ✅");
  } catch (err) {
    console.log(err);
    res.status(500).send("Error updating");
  }
});


// ❌ DELETE PRODUCT
app.delete("/products/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.send("Deleted ✅");
  } catch (err) {
    console.log(err);
    res.status(500).send("Error deleting");
  }
});


// 🛒 PLACE ORDER (🔥 IMPORTANT FIX)
app.post("/order", async (req, res) => {
  try {
    const { user, products, total, status } = req.body;

    const order = new Order({
      user,
      products,
      total,
      status
    });

    await order.save();

    res.json({ message: "Order placed ✅" });

  } catch (err) {
    console.log("Order Error:", err);
    res.status(500).json({ error: "Order failed ❌" });
  }
});


// 📦 GET ORDERS
app.get("/orders", async (req, res) => {
  try {
    const data = await Order.find();
    res.json(data);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error fetching orders");
  }
});


// 🔄 UPDATE ORDER STATUS
app.put("/orders/:id", async (req, res) => {
  try {
    await Order.findByIdAndUpdate(req.params.id, {
      status: req.body.status
    });
    res.send("Order Updated ✅");
  } catch (err) {
    console.log(err);
    res.status(500).send("Error updating order");
  }
});


// 🚀 START SERVER
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

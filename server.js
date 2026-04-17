const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(express.json());

// 🔥 CORS (frontend connect fix)
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

// 🧾 Order Schema
const Order = mongoose.model("Order", {
  products: Array,
  total: Number,
  status: { type: String, default: "Pending" }, // 🔥 NEW
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
    res.status(500).send("Error adding product");
  }
});


// 📥 GET PRODUCTS (IMPORTANT)
app.get("/products", async (req, res) => {
  try {
    const data = await Product.find();
    res.json(data);
  } catch (err) {
    res.status(500).send("Error fetching products");
  }
});


// ✏️ UPDATE
app.put("/products/:id", async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, req.body);
    res.send("Updated ✅");
  } catch (err) {
    res.status(500).send("Error updating");
  }
});


// ❌ DELETE
app.delete("/products/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.send("Deleted ✅");
  } catch (err) {
    res.status(500).send("Error deleting");
  }
});


// 🛒 ORDER
app.post("/order", async (req, res) => {
  try {
    const order = new Order(req.body);
    await order.save();
    res.send("Order placed ✅");
  } catch (err) {
    res.status(500).send("Error placing order");
  }
});


// 📦 GET ORDERS
app.get("/orders", async (req, res) => {
  try {
    const data = await Order.find();
    res.json(data);
  } catch (err) {
    res.status(500).send("Error fetching orders");
  }
});


// 🚀 START
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
// 🔄 UPDATE ORDER STATUS
app.put("/orders/:id", async (req, res) => {
  try {
    await Order.findByIdAndUpdate(req.params.id, {
      status: req.body.status
    });
    res.send("Order Updated ✅");
  } catch (err) {
    res.status(500).send("Error updating order");
  }
});

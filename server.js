const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// 🔥 Middleware
app.use(express.json({ limit: "10mb" }));
app.use(cors({ origin: "*" }));


// 🔐 ADMIN SECURITY
function checkAdmin(req, res, next) {
  if (req.headers.admin !== "fark618") {
    return res.status(401).send("Unauthorized ❌");
  }
  next();
}


// ✅ MongoDB Connect
const MONGO_URL = process.env.MONGO_URL;

mongoose.connect(MONGO_URL)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch(err => console.log("Mongo Error ❌", err));


// 📦 PRODUCT SCHEMA (🔥 SIZE ADDED)
const Product = mongoose.model("Product", {
  name: String,
  price: Number,
  stock: Number,
  type: String,   // shirt / pant
  sizes: [String], // 🔥 NEW
  image: String
});


// 🧾 ORDER SCHEMA (SIZE SUPPORT)
const Order = mongoose.model("Order", {
  user: String,
  products: [
    {
      id: String,
      name: String,
      price: Number,
      size: String // 🔥 important
    }
  ],
  total: Number,
  status: { type: String, default: "Pending" },
  date: { type: Date, default: Date.now }
});


// 🟢 ROOT
app.get("/", (req, res) => {
  res.send("FARK618 API Running 🚀");
});


// ➕ ADD PRODUCT (🔐 SECURE)
app.post("/add-product", checkAdmin, async (req, res) => {
  try {

    const { name, price, stock, type, sizes, image } = req.body;

    const product = new Product({
      name,
      price,
      stock,
      type,
      sizes, // 🔥 store sizes
      image
    });

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
app.put("/products/:id", checkAdmin, async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, req.body);
    res.send("Updated ✅");
  } catch (err) {
    console.log(err);
    res.status(500).send("Error updating");
  }
});


// ❌ DELETE PRODUCT
app.delete("/products/:id", checkAdmin, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.send("Deleted ✅");
  } catch (err) {
    console.log(err);
    res.status(500).send("Error deleting");
  }
});


// 🛒 PLACE ORDER (SIZE INCLUDED)
app.post("/order", async (req, res) => {
  try {

    const { user, products, total } = req.body;

    const order = new Order({
      user,
      products, // size already inside
      total
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
app.put("/orders/:id", checkAdmin, async (req, res) => {
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

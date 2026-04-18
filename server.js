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
    return res.status(401).json({ error: "Unauthorized ❌" });
  }
  next();
}


// ✅ MongoDB Connect
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch(err => console.log("Mongo Error ❌", err));


// 📦 PRODUCT SCHEMA
const Product = mongoose.model("Product", {
  name: { type: String, required: true },
  price: Number,
  stock: Number,
  type: String,
  sizes: [String],   // 🔥 SIZE SUPPORT
  image: String,
  createdAt: { type: Date, default: Date.now }
});


// 🧾 ORDER SCHEMA
const Order = mongoose.model("Order", {
  user: String,
  products: [
    {
      id: String,
      name: String,
      price: Number,
      size: String
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


// ➕ ADD PRODUCT
app.post("/add-product", checkAdmin, async (req, res) => {
  try {

    let { name, price, stock, type, sizes, image } = req.body;

    // 🔥 CLEAN SIZE (IMPORTANT)
    if (sizes && Array.isArray(sizes)) {
      sizes = sizes.map(s => s.trim());
    } else {
      sizes = [];
    }

    const product = new Product({
      name,
      price,
      stock,
      type,
      sizes,
      image
    });

    await product.save();

    res.json({ message: "Product added ✅", product });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Error adding product ❌" });
  }
});


// 📥 GET PRODUCTS
app.get("/products", async (req, res) => {
  try {
    const data = await Product.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Error fetching products ❌" });
  }
});


// ✏️ UPDATE PRODUCT
app.put("/products/:id", checkAdmin, async (req, res) => {
  try {

    let updateData = req.body;

    if (updateData.sizes && Array.isArray(updateData.sizes)) {
      updateData.sizes = updateData.sizes.map(s => s.trim());
    }

    await Product.findByIdAndUpdate(req.params.id, updateData);

    res.json({ message: "Updated ✅" });

  } catch (err) {
    res.status(500).json({ error: "Error updating ❌" });
  }
});


// ❌ DELETE PRODUCT
app.delete("/products/:id", checkAdmin, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted ✅" });
  } catch (err) {
    res.status(500).json({ error: "Error deleting ❌" });
  }
});


// 🛒 PLACE ORDER
app.post("/order", async (req, res) => {
  try {

    const { user, products, total } = req.body;

    // 🔥 VALIDATION
    if (!products || products.length === 0) {
      return res.status(400).json({ error: "Cart empty ❌" });
    }

    const order = new Order({
      user,
      products,
      total
    });

    await order.save();

    res.json({ message: "Order placed ✅" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Order failed ❌" });
  }
});


// 📦 GET ORDERS
app.get("/orders", async (req, res) => {
  try {
    const data = await Order.find().sort({ date: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Error fetching orders ❌" });
  }
});


// 🔄 UPDATE ORDER STATUS
app.put("/orders/:id", checkAdmin, async (req, res) => {
  try {

    await Order.findByIdAndUpdate(req.params.id, {
      status: req.body.status
    });

    res.json({ message: "Order Updated ✅" });

  } catch (err) {
    res.status(500).json({ error: "Error updating order ❌" });
  }
});


// 🚀 START SERVER
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

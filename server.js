const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());

// 🔗 MongoDB Connect
mongoose.connect("YOUR_MONGO_URL")
.then(()=>console.log("MongoDB Connected ✅"))
.catch(err=>console.log(err));

// 📦 Product Schema
const productSchema = new mongoose.Schema({
  name: String,
  style: String,
  sizeStock: {
    S: { type: Number, default: 0 },
    M: { type: Number, default: 0 },
    L: { type: Number, default: 0 },
    XL: { type: Number, default: 0 },
    XXL: { type: Number, default: 0 },
    "30": { type: Number, default: 0 },
    "32": { type: Number, default: 0 },
    "34": { type: Number, default: 0 },
    "36": { type: Number, default: 0 },
    "38": { type: Number, default: 0 },
    "40": { type: Number, default: 0 }
  }
}, { timestamps: true });

const Product = mongoose.model("Product", productSchema);


// 🔐 Dummy Admin Middleware (keep yours if already exists)
const checkAdmin = (req,res,next)=>{
  next();
};


// ==============================
// ✅ ADD PRODUCT
// ==============================
app.post("/add-product", checkAdmin, async (req, res) => {
  try {

    const product = new Product(req.body);
    await product.save();

    res.json({
      success: true,
      message: "Product Added ✅"
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Add product failed ❌"
    });
  }
});


// ==============================
// ✅ GET PRODUCTS (IMPORTANT FIX)
// ==============================
app.get("/products", async (req, res) => {
  try {

    const products = await Product.find().sort({ createdAt: -1 });

    res.json(products);

  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: "Failed to fetch products"
    });
  }
});


// ==============================
// 🔁 SYNC ZAKYA STOCK
// ==============================
app.get("/sync-zakya", async (req,res)=>{

  try{

    const response = await axios.get(
      "https://www.zohoapis.in/inventory/v1/items",
      {
        params: {
          organization_id: "60034808871"
        },
        headers:{
          Authorization: "Zoho-oauthtoken 1000.35e3e8c785173018430194ac5ab5c34d.23267cfa088f5d90ba019cb0cad663f3"
        }
      }
    );

    const items = response.data.items;

    const shirtMap = {
      "1":"S","2":"M","3":"L","4":"XL","5":"XXL"
    };

    const pantMap = {
      "1":"30","2":"32","3":"34","4":"36","5":"38","6":"40"
    };

    for(let item of items){

      const sku = item.sku;
      if(!sku || sku.length < 5) continue;

      const style = sku.slice(0,4);
      const sizeCode = sku.slice(-1);

      let size = shirtMap[sizeCode] || pantMap[sizeCode];
      if(!size) continue;

      await Product.updateOne(
        { style: style },
        {
          $set: {
            [`sizeStock.${size}`]: item.available_stock
          }
        }
      );
    }

    res.json({msg:"Zakya Sync Success ✅"});

  }catch(err){
    console.log(err.response?.data || err.message);
    res.status(500).json({error:"Sync failed"});
  }

});


// ==============================
// 🚀 SERVER START
// ==============================
app.listen(5000, ()=>{
  console.log("Server running on port 5000 🚀");
});

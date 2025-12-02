import braintree from 'braintree';
import dotenv from 'dotenv';
import fs from 'fs';
import slugify from "slugify";
import categoryModel from '../models/categoryModel.js';
import orderModel from '../models/orderModel.js';
import productModel from "../models/productModel.js";

dotenv.config();

//payment gateway api
var gateway = new braintree.BraintreeGateway({
    environment: braintree.Environment.Sandbox,
    merchantId: process.env.BRAINTREE_MERCHANT_ID,
    publicKey: process.env.BRAINTREE_PUBLIC_KEY,
    privateKey: process.env.BRAINTREE_PRIVATE_KEY,
});

// let { cart } = req.body;
// if (typeof cart === 'string') {
//   try { cart = JSON.parse(cart); }
//   catch (e) { cart = []; }
// }
// if (!Array.isArray(cart)) cart = [];


//create product
export const createProductController = async(req, res) =>{
    try{
        const {name, slug, description, price, category, quantity, shipping} = req.fields
        const {photo} = req.files
        //validation
        switch(true){
            case !name:
                return res.status(500).send({error:'Name is Required'})
            case !description:
                return res.status(500).send({error:'Description is Required'})
            case !price:
                return res.status(500).send({error:'Price is Required'})
            case !category:
                return res.status(500).send({error:'Category is Required'})
            case !quantity:
                return res.status(500).send({error:'Quantity is Required'})
            case photo && photo.size > 1000000:
                return res.status(500).send({error:'Photo is Required and Should be less then 1mb'})
        }

        const products = new productModel({...req.fields, slug:slugify(name)})
        if(photo){
            products.photo.data = fs.readFileSync(photo.path)
            products.photo.contentType = photo.type
        }
        await products.save()
        res.status(201).send({
            success:true,
            message:'Product Created Succesfully',
            products,
        });
    }catch(error){
        console.log(error)
        res.status(500).send({
            success:false,
            message:'Error in Creating Product',
            error
        })
    }
};

//get all product
export const getProductController = async(req, res) =>{
    try{
        const products = await productModel.find({}).populate('category').select('-photo').limit(12).sort({createAt:-1})
        res.status(200).send({
            success:true,
            countTotal:products.length,
            message:'ALL Products',
            products
        });
    }catch(error){
        console.log(error)
        res.status(500).send({
            success:false,
            message:'Error in getting Products',
            error:error.message
        })
    };
};

//get single product
export const getSingleProductController = async(req,res) =>{
    try{
        const product = await productModel.findOne({slug:req.params.slug}).select('-photo').populate('category')
        res.status(200).send({
            success:true,
            message:'Single Prodcut Fethched',
            product
        })
    }catch(error){
        console.log(error)
        res.status(500).send({
            success:false,
            message:'Error in getting single product',
            error
        })
    }
}

// get photo
export const productPhotoController = async (req, res) => {
  try {
    const { pid } = req.params; // or use req.params.productId depending on your route
    // Fetch only the photo field (avoid pulling large fields unnecessarily)
    const product = await productModel.findById(pid).select('photo');

    if (!product) {
      // Product not found
      return res.status(404).send({ success: false, message: 'Product not found' });
    }

    if (!product.photo || !product.photo.data) {
      // Photo not present for this product
      // Option A: return 404
      return res.status(404).send({ success: false, message: 'Product photo not found' });

      // Option B: serve a placeholder image instead (uncomment to use)
      // const placeholderPath = path.join(process.cwd(), 'public', 'images', 'placeholder.png');
      // if (fs.existsSync(placeholderPath)) {
      //   const imgBuffer = fs.readFileSync(placeholderPath);
      //   res.set('Content-Type', 'image/png');
      //   return res.send(imgBuffer);
      // }
      // return res.status(404).send({ success: false, message: 'Product photo not available' });
    }

    // If we reach here, product.photo exists and contains data and mimetype
    res.set('Content-Type', product.photo.contentType || 'application/octet-stream');
    return res.send(product.photo.data);
  } catch (err) {
    console.error('productPhotoController error:', err);
    return res.status(500).send({
      success: false,
      message: 'Error retrieving product photo',
      error: err?.message ?? err,
    });
  }
};

//delete product
export const deleteProductController = async(req,res) =>{
    try{
        await productModel.findByIdAndDelete(req.params.pid).select('-photo')
        res.status(200).send({
            success:true,
            message:'Product Deleted Successfully',
        })
    }catch(error){
        console.log(error)
        res.status(500).send({
            success:false,
            message:'Error While deleting Product',
            error
        })
    }
}

//update product
export const updateProductController = async(req,res) =>{
    try{
        const {name, slug, description, price, category, quantity, shipping} = req.fields
        const {photo} = req.files
        //validation
        switch(true){
            case !name:
                return res.status(500).send({error:'Name is Required'})
            case !description:
                return res.status(500).send({error:'Description is Required'})
            case !price:
                return res.status(500).send({error:'Price is Required'})
            case !category:
                return res.status(500).send({error:'Category is Required'})
            case !quantity:
                return res.status(500).send({error:'Quantity is Required'})
            case photo && photo.size > 1000000:
                return res.status(500).send({error:'Photo is Required and Should be less then 1mb'})
        }

        const products = await productModel.findByIdAndUpdate(req.params.pid,
            {...req.fields, slug:slugify(name)},{new:true})
        if(photo){
            products.photo.data = fs.readFileSync(photo.path)
            products.photo.contentType = photo.type
        }
        await products.save()
        res.status(201).send({
            success:true,
            message:'Product Updated Succesfully',
            products,
        });
    }catch(error){
        console.log(error)
        res.status(500).send({
            success:false,
            message:'Error in Updating Product',
            error
        })
    }
}

// filters
export const productFiltersController = async (req, res) => {
    try {
        const { checked, radio } = req.body;
        let args = {};
        if (checked.length > 0) args.category = checked;
        if (radio.length) args.price = { $gte: radio[0], $lte: radio[1] };
        const products = await productModel.find(args);
        res.status(200).send({
        success: true,
        products,
        });
    } catch (error) {
        console.log(error);
        res.status(400).send({
        success: false,
        message: "Error While Filtering Products",
        error,
        });
    }
}; 

// product count
export const productCountController = async (req, res) => {
    try {
        const total = await productModel.find({}).estimatedDocumentCount();
        res.status(200).send({
        success: true,
        total,
        });
    } catch (error) {
        console.log(error);
        res.status(400).send({
        message: "Error in Product Count",
        error,
        success: false,
        });
    }
};

// product list base on page
export const productListController = async (req, res) => {
    try {
        const perPage = 3;
        const page = req.params.page ? req.params.page : 1;
        const products = await productModel
        .find({})
        .select("-photo")
        .skip((page - 1) * perPage)
        .limit(perPage)
        .sort({ createdAt: -1 });
        res.status(200).send({
        success: true,
        products,
        });
    } catch (error) {
        console.log(error);
        res.status(400).send({
        success: false,
        message: "error in per page ctrl",
        error,
        });
    }
};

//search product
export const searchProductController = async (req, res) => {
    try {
        const { keyword } = req.params;
        const results = await productModel
        .find({
            $or: [
            { name: { $regex: keyword, $options: "i" } },
            { description: { $regex: keyword, $options: "i" } },
            ],
        })
        .select("-photo");
        res.json(results);
    } catch (error) {
        console.log(error);
        res.status(400).send({
        success: false,
        message: "Error in Search Product API",
        error,
        });
    }
};

//similar products
export const relatedProductController = async (req, res) => {
    try {
        const { pid, cid } = req.params;
        const products = await productModel
        .find({
            category: cid,
            _id: { $ne: pid },
        })
        .select("-photo")
        .limit(3)
        .populate("category");
        res.status(200).send({
        success: true,
        products,
        });
    } catch (error) {
        console.log(error);
        res.status(400).send({
        success: false,
        message: "Error While Getting Related Products",
        error,
        });
    }
};

//category wise product
export const productCategoryController = async (req, res) => {
    try {
        const { slug } = req.params;
        // find category by slug
        const category = await categoryModel.findOne({ slug });
        if (!category) {
            return res.status(404).send({
                success: false,
                message: 'Category not found',
            });
        }
        // find products that belong to this category
        const products = await productModel
            .find({ category: category._id })
            .select('-photo')
            .populate('category');

        res.status(200).send({
            success: true,
            products,
            category,
        });
    } catch (error) {
        console.log(error);
        res.status(400).send({
        success: false,
        message: "Error While Getting Category Products",
        error,
        });
    }
};

//payment gateway api
//token
export const braintreeTokenController = async (req, res) => {
    try {
        gateway.clientToken.generate({}, function (err, response) {
        if (err) {
            res.status(500).send(err);
        } else {
            res.send(response);
        }
        });
    } catch (error) {
        console.log(error);
    }
};

//payment
export const braintreePaymentController = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).send({ success: false, message: "Unauthorized" });
    }

    let { nonce, cart, clientOrderId } = req.body;

    // Normalize cart (handle stringified cart)
    if (typeof cart === "string") {
      try {
        cart = JSON.parse(cart);
      } catch (e) {
        console.error("Invalid cart JSON:", e);
        cart = [];
      }
    }
    const items = Array.isArray(cart) ? cart : [];

    if (!items.length) {
      return res.status(400).send({ success: false, message: "Cart is empty or invalid" });
    }

    // Fetch products from DB
    const ids = items.map((i) => i.productId || i._id);
    const products = await productModel.find({ _id: { $in: ids } }).select("price name");

    if (!products || products.length === 0) {
      return res.status(400).send({ success: false, message: "Products not found" });
    }

    // Build orderProducts subdocuments and compute total
    let total = 0;
    const orderProducts = [];

    for (const item of items) {
      const prodId = item.productId || item._id;
      const prod = products.find((p) => p._id.toString() === prodId);
      if (!prod) {
        return res.status(400).send({ success: false, message: `Product not found: ${prodId}` });
      }

      const qty = Number(item.quantity) > 0 ? Number(item.quantity) : 1;
      const price = Number(prod.price) || 0;
      const lineTotal = price * qty;
      total += lineTotal;

      // build subdoc matching orderModel schema (includes required 'product' field)
      orderProducts.push({
        product: prod._id,          // required field in your schema
        name: prod.name || "",
        price: price,
        quantity: qty,
        lineTotal: lineTotal.toFixed(2)
      });
    }

    const amount = total.toFixed(2);

    // Optional idempotency check (if you implemented clientOrderId)
    if (clientOrderId) {
      const existing = await orderModel.findOne({ clientOrderId, buyer: userId });
      if (existing && existing.payment && existing.payment.status && existing.payment.status !== "failed") {
        return res.status(200).send({ success: true, message: "Order already processed", orderId: existing._id });
      }
    }

    // Process payment with Braintree
    gateway.transaction.sale(
      {
        amount,
        paymentMethodNonce: nonce,
        options: { submitForSettlement: true },
      },
      async function (error, result) {
        if (error) {
          console.error("Braintree transaction error:", error);
          return res.status(500).send({ success: false, error });
        }

        if (!result || !result.success || !result.transaction) {
          console.error("Braintree failed result:", result);
          return res.status(500).send({ success: false, result });
        }

        // Minimal payment record to store
        const paymentSummary = {
          transactionId: result.transaction.id,
          amount: result.transaction.amount,
          status: result.transaction.status,
        };

        try {
          const newOrder = new orderModel({
            products: orderProducts,   // subdocuments including required 'product'
            payment: paymentSummary,
            buyer: userId,
            clientOrderId: clientOrderId || null,
          });

          await newOrder.save();

          return res.json({
            success: true,
            message: "Payment successful and order saved",
            orderId: newOrder._id,
            payment: paymentSummary,
          });
        } catch (saveErr) {
          console.error("Order save error:", saveErr);
          return res.status(500).send({ success: false, message: "Order save failed", error: saveErr });
        }
      }
    );
  } catch (err) {
    console.error("braintreePaymentController error:", err);
    res.status(500).send({ success: false, message: "Server error", error: err });
  }
};


// // then create order:
// const newOrder = new orderModel({
//   products: orderProducts,
//   payment: paymentSummary,
//   buyer: userId,
//   clientOrderId: clientOrderId || null,
// });
// await newOrder.save();

// const session = require('express-session');
// const User=require('../models/userModel');
const Address = require('../models/addressModel');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel');
// const bcrypt=require("bcrypt");
// const nodemailer = require('nodemailer');
const randomstring = require('randomstring');
const Order = require('../models/orderModel');
const Coupon = require('../models/couponModel');
const Razorpay = require('razorpay')
const crypto = require('crypto');
const cartload = async (req, res) => {
  try {
    const userId = req.session.user_id; 
    const productId = req.query.id;

    const product = await Product.findOne({ _id: productId });
    let cart = await Cart.findOne({ owner: userId });

    if (!cart) {
      cart = new Cart({
        owner: userId,
        items: [],
        billTotal: 0
      });
    }

    const existingItemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
    
    if (existingItemIndex !== -1) {
      if (cart.items[existingItemIndex].quantity >= product.countinstock) {
        console.log('out of stock')
        return res.status(200).json({ success: false, message: 'Product is out of stock' });
      } else if (cart.items[existingItemIndex].quantity >= 5) {
        return res.status(200).json({ success: false, message: 'Cannot add more than 5 products in cart' });
      } else {
        cart.items[existingItemIndex].quantity++;
        cart.items[existingItemIndex].price += product.price;
        cart.billTotal += product.price;
      }
    } else {
      cart.items.push({
        productId: product._id,
        image: product.images[0],
        name: product.productname,
        productPrice: product.price,
        quantity: 1,
        price: product.price,
        selected: false
      });
      cart.billTotal += product.price;
    }

    await cart.save();

    return res.status(200).json({ success: true, message: 'Item added to cart' });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};




const cartpageload = async(req,res)=>{
  try{
    const cart = await Cart.findOne({ owner: req.session.user_id }).populate({path:'items.productId',model:'Product'})
   

    res.render('cart',{cart})
  }
  catch(error){
    console.log(error.message)
  }
}


  
const updateQuantity = async (req, res) => {
  try {
  console.log('kjskjdfgk')
    const userId = req.session.user_id;

    let cart = await Cart.findOne({ owner: userId }).populate({ path: 'items.productId', model: 'Product' });
    if (!cart) {
        return res.status(404).json({ success: false, message: "Cart not found" });
    }

    const { productId, need } = req.body;
    const cartItem = cart.items.find(item => item.productId._id.toString() === productId);
    if (!cartItem) {
        console.log('Cart item not found in update cart');
        return res.status(404).json({ success: false, message: "Cart item not found" });
    }

    const maxPerPerson = 5;
    if (cartItem.quantity >= maxPerPerson && need !== "sub") {
        return res.status(400).json({ success: false, message: "Maximum quantity per person for this product has been reached" });
    }

    if (need === "sub") {
        cartItem.quantity = Math.max(1, cartItem.quantity - 1);
    } else if (need === "sum") {
        const maxQuantity = Math.min(cartItem.productId.countinstock, maxPerPerson);
        cartItem.quantity = Math.min(cartItem.quantity + 1, maxQuantity);
    } else {
        return res.status(404).json({ success: false, message: "Invalid operation" });
    }

    cartItem.price = cartItem.quantity * cartItem.productId.price;
    cart.billTotal = cart.items.reduce((total, item) => total + (item.quantity * item.productId.price), 0);

    await cart.save();
    return res.status(200).json({ success: true, cart });

  } catch (error) {
      console.error(error.message);
      return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};




const deletecartitem = async (req, res) => {
  try {
    const id = req.query.id;
    console.log(id)

    const cart = await Cart.findOne({ owner: req.session.user_id });

    if (cart) {
      const itemIndex = cart.items.findIndex(item => item.productId._id.toString() === id);

      if (itemIndex !== -1) {
        const deletedItem = cart.items[itemIndex];
        cart.items.splice(itemIndex, 1);

  
        cart.billTotal -= (deletedItem.productPrice * (deletedItem.quantity));

        await cart.save();

        return res.status(200).json({ success: true, message: "Item deleted successfully" });
      } else {
        console.log('Item not found in the cart');
        return res.status(404).json({ message: "Item not found in the cart" });
      }
    } else {
      return res.status(404).json({ message: "Cart not found" });
    }
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
}






const checkoutpage = async(req,res)=>{
  try{
    
const id = req.session.user_id
const address = await Address.find({user:id});
const cart = await Cart.findOne({owner:req.session.user_id})
 res.render('checkout',{cart,address})
  }catch(error){
    console.log(error.message)
  }
}



// const orderload = async (req, res) => {
//     try {
      
//         const {
//             user,
//             cart,
//             oId,
//             items,
//             billTotal,
//             paymentMethod,
//             paymentStatus,
//             deliveryAddress,
//             orderDate,
//             status,
//             reason,
//             requests
//         } = req.body;
//          const newOrder = new Order({
//             user,
//             cart,
//             oId,
//             items,
//             billTotal,
//             paymentMethod,
//             paymentStatus,
//             deliveryAddress,
//             orderDate,
//             status,
//             reason,
//             requests
//         });

       
//         await newOrder.save();

      
//         return res.status(201).json({ success: true, message: 'Order saved successfully' });
//     } catch (error) {
      
//         console.error(error);
//         return res.status(500).json({ success: false, message: 'Internal server error' });
//     }
// };

function generateoId(){
  const oId = randomstring.generate({
     length:4,
     charset:'numeric'
 
   });
   return oId;
 
 }

 var instance = new Razorpay({ key_id: 'rzp_test_S0n0KoYcfH03Z8', key_secret: '4zspRlSBEVt30znhYdnWTJ5L' })


 const orderload = async (req, res) => {
  try {
    const cart = await Cart.findOne({ owner: req.session.user_id });
  
    
    if(req.body.paymentMethod=== "online"){
      
        const order = await instance.orders.create({
          amount: cart.billTotal*100,
          currency: "INR",
          receipt: cart._id, 
        
      });

   
      res.json({status: "online", order: order});

    }else if(req.body.paymentMethod==="COD"){
   console.log("dfkdsjfbdskh")
   console.log(req.body.deliveryAddress)

   const cart = await Cart.findOne({ owner: req.session.user_id });
    const oId = generateoId();
    const { items, billTotal } = cart;
      const user = req.session.user_id;
      const { paymentMethod, deliveryAddress } = req.body;
      const parsedDeliveryAddress = JSON.parse(deliveryAddress);

      const newOrder = new Order({
          user,
          cart: cart._id, 
          oId,
          items,
          billTotal,
          paymentMethod,
          deliveryAddress: parsedDeliveryAddress 
      });
      
      for (const item of cart.items) {
        const productId = item.productId;
        const quantity = item.quantity;
        const product = await Product.findById(productId);
        product.countinstock -= quantity;

        await product.save();
    }
    cart.items = []; 
    cart.billTotal = 0;
    
  
      await cart.save();
      await newOrder.save();

  res.json({status: "COD",message:"order added successfuly",cart:cart});
  }else{
    console.log("errorr")
  }
  } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

 const orderonlineload = async (req,res)=>{
  try{
  console.log(req.body.paymentData);
 console.log(req.body.paymentData.razorpay_signature);
  const razorpaySecret = "4zspRlSBEVt30znhYdnWTJ5L";
 const body = req.body.paymentData.razorpay_order_id + "|" + req.body.paymentData.razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", razorpaySecret)
      .update(body)
      .digest("hex");

    if (expectedSignature === req.body.paymentData.razorpay_signature) {
      console.log("Corrected Verify");
      const deliveryAddress = req.body.paymentData.selectedAddress;
      const parsedDeliveryAddress = JSON.parse(deliveryAddress);
       const cart = await Cart.findOne({owner:req.session.user_id})
       const user = req.session.user_id
       const { items, billTotal } = cart;
      const newOrder = new Order({
          user,
          cart: cart._id, 
          oId: req.body.paymentData.razorpay_order_id ,
          items,
          billTotal,
          paymentMethod:"online",
          paymentStatus:"success",
          deliveryAddress: parsedDeliveryAddress 
      });
      
      for (const item of cart.items) {
        const productId = item.productId;
        const quantity = item.quantity;
        const product = await Product.findById(productId);
        product.countinstock -= quantity;

        await product.save();
    }
    cart.items = []; 
    cart.billTotal = 0;
    
  
      await cart.save();
      await newOrder.save();

  res.json({success:true,message:"order added successfuly",cart:cart});



    } else {
      console.log("Incorrect Signature");
     
    }
  }catch(error){
    console.log(error.message)
  }
 }

const ordersuccess = async (req,res)=>{
try{

  const id = req.session.user_id
  const order = await Order.findOne({user:id})
 
res.render('ordersuccess',{order})
}catch(error){
  console.log(error)
}
}


const checkcoupon = async(req,res)=>{
  try{
console.log("ndfjfdkfjr");
const code = req.body.couponcode;
console.log(code);
const cart = await Cart.findOne({owner:req.session.user_id})
const coupons = await Coupon.findOne({code:code});
console.log(cart); 

if(coupons){
  if(coupons.isActive==true){
  cart.billTotal -= coupons.maxDiscountAmount;
  await cart.save();
  console.log('coupon is verified')
  }else{
    console.log('coupon is inactive')
  }

}else{
  console.log('coupon is not find')
}
return res.status(200).json({ success: true, message: 'Cart not found' });

  }catch(error){
    console.log(error.message)
  }
}







module.exports={
cartload,
cartpageload,
deletecartitem,
updateQuantity,
checkoutpage,
orderload,
ordersuccess,
checkcoupon ,
orderonlineload

}
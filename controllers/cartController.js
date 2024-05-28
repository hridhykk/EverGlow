
const Address = require('../models/addressModel');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel');

const randomstring = require('randomstring');
const Order = require('../models/orderModel');
const Coupon = require('../models/couponModel');
const Razorpay = require('razorpay')
const Wishlist =require('../models/wishlistModel');

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
       
        return res.status(200).json({ success: false, message: 'Product is out of stock' });
      } else if (cart.items[existingItemIndex].quantity >= 5) {
        return res.status(200).json({ success: false, message: 'Cannot add more than 5 products in cart' });
      } else {
        cart.items[existingItemIndex].quantity++;
        cart.quantity++;
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
        selected: false,
        couponapplied:false,
        discountPrice:0,
      });
      quantity: 1,
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
    const coupon = await Coupon.find();
    const user = req.session.user_id;
    const cart = await Cart.findOne({ owner: req.session.user_id }).populate({path:'items.productId',model:'Product'})
    const wishlist = await Wishlist .findOne({user:req.session.user_id});

    res.render('cart',{cart,coupon,user,wishlist});
  }
  catch(error){
    console.log(error.message)
  }
}


  
const updateQuantity = async (req, res) => {
  try {
 
    const userId = req.session.user_id;

    let cart = await Cart.findOne({ owner: userId }).populate({ path: 'items.productId', model: 'Product' });
    if (!cart) {
        return res.status(404).json({ success: false, message: "Cart not found" });
    }

    const { productId, need } = req.body;
    const cartItem = cart.items.find(item => item.productId._id.toString() === productId);
    if (!cartItem) {
        
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


    const cart = await Cart.findOne({ owner: req.session.user_id }).populate({path:'items.productId',model:'Product'});

    if (cart) {
      const itemIndex = cart.items.findIndex(item => item.productId._id.toString() === id);

      if (itemIndex !== -1) {
        const deletedItem = cart.items[itemIndex];
        cart.items.splice(itemIndex, 1);

        if (cart.couponapplied) {
          cart.discountPrice = 0;
          cart.couponapplied = false;
          cart.billTotal -= (deletedItem.productId.price + cart.discountPrice) * deletedItem.quantity;
         
      } else {
          cart.billTotal -= deletedItem.productId.price * deletedItem.quantity;
      }
      

        await cart.save();

        return res.status(200).json({ success: true, message: "Item deleted successfully" });
      } else {
        // console.log('Item not found in the cart');
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
const wishlist = await Wishlist .findOne({user:req.session.user_id});
 res.render('checkout',{cart,address,wishlist})
  }catch(error){
    console.log(error.message)
  }
}



function generateoId(){
  const oId = randomstring.generate({
     length:4,
     charset:'numeric'
 
   });
   return oId;
 
 }

 var instance = new Razorpay({ key_id:process.env.RAZORPAY_KEYID, key_secret:process.env.RAZORPAY_SECRET})


 const orderload = async (req, res) => {
  try {
    const cart = await Cart.findOne({ owner: req.session.user_id });
  
    
    if(req.body.paymentMethod=== "online"){
      
      let amount;
      if (cart.couponapplied === true) {
        amount = cart.discountPrice * 100;
      } else {
        amount = cart.billTotal * 100;
      }

      const order = await instance.orders.create({
        amount: amount,
        currency: "INR",
        receipt: cart._id
      });

   
      res.json({status: "online", order: order});

    }else if(req.body.paymentMethod==="COD"){
  
 

   let cart = await Cart.findOne({ owner: req.session.user_id }).populate({path:'items.productId',model:'Product'});
 
  

   const items = cart.items.map(item => ({
    productId: item.productId._id,
     image: item.productId.images[0],
    name: item.productId.productname,
    productPrice: item.productId.price,
    quantity: item.quantity,
    price:item.price
  }))
  console.log("hridjysaaaa",items)

 
   const oId = generateoId();
  const {  billTotal,discountPrice ,couponapplied} = cart;
      const user = req.session.user_id;
      const { paymentMethod, deliveryAddress } = req.body;
      const parsedDeliveryAddress = JSON.parse(deliveryAddress);

      const newOrder = new Order({
          user,
          cart: cart._id, 
          oId,
          items,
          billTotal,
          discountPrice,
          couponapplied,
          paymentMethod,
          deliveryAddress: parsedDeliveryAddress 
      });
      
      for (const item of cart.items) {
        const productId = item.productId;
        const quantity = item.quantity;
        const product = await Product.findById(productId);
        product.countinstock -= quantity;
        product.popularity += 1

        await product.save();
    }
    cart.items = []; 
    cart.billTotal = 0;
    
  
      await cart.save();
      await newOrder.save();

  res.json({status: "COD",message:"order added successfuly",cart:cart,oId:oId});
  }else{
  
  }
  } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Internal server error' });
  }
};





 const orderonlineload = async (req,res)=>{
  try{
  
  const razorpaySecret = "4zspRlSBEVt30znhYdnWTJ5L";
 const body = req.body.paymentData.razorpay_order_id + "|" + req.body.paymentData.razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", razorpaySecret)
      .update(body)
      .digest("hex");

    if (expectedSignature === req.body.paymentData.razorpay_signature) {
  
      const deliveryAddress = req.body.paymentData.selectedAddress;
      const parsedDeliveryAddress = JSON.parse(deliveryAddress);
       const cart = await Cart.findOne({owner:req.session.user_id}).populate({path:'items.productId',model:'Product'})
       const user = req.session.user_id
       const items = cart.items.map(item => ({
        productId: item.productId._id,
         image: item.productId.images[0],
        name: item.productId.productname,
        productPrice: item.productId.price,
        quantity: item.quantity,
        price:item.price
      }))
       const { billTotal,discountPrice,couponapplied } = cart;
      const newOrder = new Order({
          user,
          cart: cart._id, 
          oId: req.body.paymentData.razorpay_order_id ,
          items,
          billTotal,
          discountPrice,
          couponapplied,
          paymentMethod:"online",
         
          paymentStatus:'Success',
          deliveryAddress: parsedDeliveryAddress 
      });
      
      for (const item of cart.items) {
        const productId = item.productId;
        const quantity = item.quantity;
        const product = await Product.findById(productId);
        product.countinstock -= quantity;
        product.popularity += 1;

        await product.save();
    }
    cart.items = []; 
    cart.billTotal = 0;
    cart.couponapplied = false;
    cart.discountPrice = 0;
   
      await cart.save();
      await newOrder.save();


  res.json({success:true,message:"order added successfuly", oId:req.body.paymentData.razorpay_order_id});



    } else {
      console.log("Incorrect Signature");
     
    }
  }catch(error){
    console.log(error.message)
  }
 }





 const orderfailed = async(req,res)=>{
  try{
    const deliveryAddress = req.body.paymentData.selectedAddress;
    const parsedDeliveryAddress = JSON.parse(deliveryAddress);
     const cart = await Cart.findOne({owner:req.session.user_id}).populate({path:'items.productId',model:'Product'})
     const user = req.session.user_id
     const { billTotal,discountPrice,couponapplied } = cart;
     const items = cart.items.map(item => ({
      productId: item.productId._id,
       image: item.productId.images[0],
      name: item.productId.productname,
      productPrice: item.productId.price,
      quantity: item.quantity,
      price:item.price 
    }))
    const oId = generateoId();
  
   
      const newOrder = new Order({
          user,
          cart: cart._id, 
          oId,
          items,
          billTotal,
          discountPrice,
          couponapplied,
          
          paymentStatus:"Failed",
          deliveryAddress: parsedDeliveryAddress 
      });
      
      for (const item of cart.items) {
        const productId = item.productId;
        const quantity = item.quantity;
        const product = await Product.findById(productId);
        product.countinstock -= quantity;
        product.popularity += 1 ;
        await product.save();
    }
    cart.items = []; 
    cart.billTotal = 0;
    
  
      await cart.save();
      await newOrder.save();

  res.json({success:true,message:"order added successfuly",cart:cart,oId:oId});
  
  }
  catch(error){
    console.log(error.message)
  }


 }







const ordersuccess = async (req,res)=>{
try{

  const id = req.query.oId;
 
  const order = await Order.findOne({oId:id})
 
res.render('ordersuccess',{order})
}catch(error){
  console.log(error);
  res.status(500).send('Internal Server Error');
}
}


const checkcoupon = async(req,res)=>{
  try{

const code = req.body.couponcode;
const user = req.session.user_id;

const cart = await Cart.findOne({owner:req.session.user_id})
const coupons = await Coupon.findOne({code:code});
const tottalamount = cart.billTotal;
const discountPercentage = coupons.discountPercentage
const discountAmount = (tottalamount*discountPercentage)/100;




cart.discountPrice = (tottalamount-discountAmount);
cart.couponapplied= true; 
coupons.usersUsed.push(user);
coupons.maxUsers--;
await coupons.save();
await cart.save();
res.redirect('/cartpage')
// return res.status(200).json({ success: true, message: 'Cart not found' });

  }catch(error){
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
}

const removecoupon = async(req,res)=>{
  try{

const id = req.query.id;

await Cart.findByIdAndUpdate({_id:id},{$set:{
couponapplied:false,
discountPrice:0,

}});
const userId = req.session.user_id;
const Fullcoupon = await Coupon.find();
const coupons= Fullcoupon.filter(coupon => coupon.usersUsed.includes(userId));
 let coupon=coupons[0];


 const userIdIndex = coupon.usersUsed.indexOf(userId);
        if (userIdIndex !== -1) {
            coupon.usersUsed.splice(userIdIndex, 1);
        }
        coupon.maxUsers++;
        
        await coupon.save();
    
        
res.json({success:true});
  }catch(error){
    console.log(error.message);
    res.status(500).send('Internal Server Error');
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
orderonlineload,
orderfailed,
removecoupon

}
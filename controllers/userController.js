const session = require('express-session');
const User=require('../models/userModel');
const Address = require('../models/addressModel');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel');
const bcrypt=require("bcrypt");
const nodemailer = require('nodemailer');
const randomstring = require('randomstring');
const Order = require('../models/orderModel');
const Wishlist = require('../models/wishlistModel');
const mongoose = require('mongoose');
const Category = require('../models/categoryModel');
const Wallet = require('../models/walletModel');
var easyinvoice = require('easyinvoice');
const fs = require('fs');
const Razorpay = require('razorpay')
const crypto = require('crypto');

const securePassword = async(password)=>{
  try{
   
    const passwordHash= await bcrypt.hash(password,10);
    return passwordHash;

  }catch(error){
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
 }

 const logouts = async (req,res)=>{
  try{
    req.session.user_id=false ;
    req.session.isblocked= true;
    res.redirect('/login')
  }
  catch(error){
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }

 }

 function generateReferralCode() {
     const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
     let referralCode = '';
     for (let i = 0; i < 6; i++) {
         const randomIndex = Math.floor(Math.random() * characters.length);
         referralCode += characters[randomIndex];
     }
     return referralCode;
 }  

 function generateOTP(email){
  const otp = randomstring.generate({
     length:6,
     charset:'numeric'
 
   });
   return otp;
 
 }
 
 
 const sendOTP = async(email,otp)=>{
   try{
     let transporter = nodemailer.createTransport({
       service:'gmail',
       auth:{
         user: 'hridhyashijina@gmail.com',
         pass: 'psyk gvdw ratk nvwi'
       }
     });
   let mailoption = {
     from:'hridhyashijina@gmail.com',
     to: email,
     subject: 'OTP verification',
     text : `your OTP is : ${otp}`
   }
  
  transporter.sendMail(mailoption,(error,info)=>{
     if(error){
       console.error(error);
       res.status(500).json({message:'internal server error'})
     }else{
       console.log('email sent:', info.response);
       console.log('otp:', otp)
     }
   })
  return otp;
 
   }catch(error){
     console.log(error);
     res.status(500).send('Internal Server Error');
 
   }
 }





 
 const loadRegister=async(req,res)=>{
  try{
    res.render('registration.ejs');

  }catch(error){
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
}







const initialinsertUser = async (req, res) => {
  try {
   
    if (!req.body) {
      throw new Error('No data received');
    }
  
    const { name, email, phone, password ,referralcode} = req.body;
   
    req.session.userData = {};
    
    const existingUser = await User.findOne({
      $or: [{
          email: email,
        },
        {
          phone: phone,
        },
       
      ],
    });
 
     const refferal = await User.findOne({referralcode:referralcode});
    

    if (existingUser) {
      if (existingUser.email === email && existingUser.phone == phone) {
        return res.render("registration", {message:"Email and phone number is already registered"});
      }
       else if (existingUser.email == email) {
        return res.render("registration", { message: "Email is already registered" });
      } else if (existingUser.phone == phone) {
        return res.render("registration", { message: "Phone number is already registered" });
      }
   

    }  else {
      
    if(req.body.referralcode){
      if(!refferal){
       return res.render("registration", { message: "refferal offer is not excisting" });
       }
     }
      const spassword = await securePassword(password);
      const OTP = generateOTP();
      
  
      const userEmail = email;
      
      await sendOTP(userEmail, OTP);
      
      req.session.userData = {
        name: name,
        email: email,
        password: spassword,
        is_admin: 0,
        isBlocked: false,
        OTP: OTP,
        phone: phone,
        referralcode:referralcode
      };
    
      return res.redirect('/otp');
    }

  

  } catch (error) {
    console.log(error.message);
    return res.status(500).send('Internal Server Error');
  }
};



const otpload=async(req,res)=>{
  try{
  
  res.render('otp');
     const  OTP = req.session.userData.OTP
    setTimeout(() => {
      delete req.session.userData.OTP;
      console.log('OTP expired new otp will generate after resend');
    }, 30000);
  }
  catch(error){
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
}


const resendandinsert = async(req,res)=>{
  try{
    const OTP = generateOTP();

    const userEmail = req.session.userData.email;
    await sendOTP(userEmail, OTP);

   req.session.userData.OTP = OTP
    setTimeout(() => {
      delete req.session.userData.OTP; 
      console.log('Resent OTP expired after 15 seconds');
    }, 15000);
    res.redirect('/otp');

  }
  catch(error){
    console.log(error.message)

  }
}



const insertuser = async(req,res)=>{
  try{
 
    
      const userOTP = req.session.userData.OTP;
     const referralcd = generateReferralCode();
    if(req.body.otp==userOTP){
      const user = new User({
      name:req.session.userData.name,
      email:req.session.userData.email,
      phone:req.session.userData.phone,
      password:req.session.userData.password,
      referralcode:referralcd,
      is_admin:0,
      isBlocked:false,
    
    });
   await user.save();

   if (req.session.userData.referralcode) {
    const findUser = await User.findOne({referralcode:req.session.userData.referralcode})
 
    // const findUserWallet = await Wallet.findOne({ user: findUser._id });

 
 let wallet = await Wallet.findOne({ user: findUser._id});
 if (!wallet) {
   wallet = await Wallet.create({ user: findUser._id});
 }

        wallet.balance += 100;
  
      
        wallet.transactions.push({
          amount: 100,
          type: 'credit', 
        });
  
        await wallet.save();
 const newUser=await User.findOne({email:req.session.userData.email})
   const forNewWallet =new Wallet({
     user:newUser._id,
     balance:100,
     transactions:[{
       amount: 100,
       type: 'credit',
     }]
   })
   await forNewWallet.save();
     res.redirect('/login')
   
    
   }
  res.redirect('/login')
    
  }else{
    res.render('otp',{message:"your registration has been failed,Enter valid OTP"})
   }

  }catch(error){
    console.error(error)
  }
}






const loginload = async(req,res)=>{
  try{
   
  res.render('login')
  }
    catch(error){
      console.log(error.message);
      res.status(500).send('Internal Server Error');
    }
}

const verifyLogin = async(req,res)=>{
  try{
    
    const email = req.body.email;
    const password = req.body.password;

    const userData = await User.findOne({email:email});
    if(userData){
      const passwordmatch = await bcrypt.compare(password,userData.password)
      if( passwordmatch){
        if(userData.isBlocked===true){
          res.render('login',{message:"user is blocked"})

        }else{
          req.session.isblocked = userData.isBlocked
          req.session.user_id = userData._id;
       
          res.redirect('/home')
        }
        }
        else{
        res.render('login',{message:'email and password is incorrect '})
       
      }

    }else{
      res.render('login',{message:'email is not excisting'})
     
    }
   

  }catch(error){
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
}

const googleSignIn = async (req, res) => {
  try {
   
      const email = req.user.email;
      let userData = await User.findOne({ email: email });
     

      if (userData) {
        req.session.userId = userData._id; // Set userId in the session
        if (userData.isBlocked==false) {
          res.locals.currentUser = userData;
          res.locals.currentUserId = userData._id;
          req.session.currentUser = userData;
          req.session.currentUserId = userData._id;
          req.session.save();
        } else {
          console.error("User is blocked");
          return res.redirect('/login?error=blocked');
        }
      } else {
        console.error("User not found");
        res.locals.currentUser = null;
      }
      if (!userData) {
          let nameFromG = req.user.name
          const user = new User({
              name: nameFromG.givenName + " "+ nameFromG.familyName,
              email: req.user.email,
              is_admin: 0,
              is_verified: 0,
              // is_google_auth:1,
              isBlocked:false
          })
          userData = await user.save()

      }
     

      const userID = userData._id;
     
      
  

      req.session.user_id = userData._id
      req.session.email = email;
      req.session.save();
      const isBlocked = false;
      const product = await Product.find({isBlocked:isBlocked});
      const wishlist = await Wishlist .findOne({user: req.session.user_id});
     const cart = await Cart.findOne({owner: req.session.user_id})
     const currentDate = new Date();
      res.render('home',{product, wishlist,cart,currentDate})
     
  } catch (error) {
      console.log(error.message);
      res.status(500).send('Internal Server Error');
  }
}


const loadhome = async(req,res)=>{
  try{
    const isBlocked = false;
    const product = await Product.find({isBlocked:isBlocked});
    const  wishlist = await Wishlist .findOne({user:req.session.user_id});
    if(!wishlist){
    wishlist= await Wishlist.create({user:req.session.user_id,products:[]})
    }
   
   const cart = await Cart.findOne({owner:req.session.user_id});
   if(!cart){
    cart = await Cart.create({owner:req.session.user_id,product:[] })
   }
   const currentDate = new Date();
    res.render('home',{product, wishlist,cart,currentDate})
   

  }catch(error){
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
}




const productdetailspage = async(req,res)=>{
  try{
const id = req.query.id;

const product = await Product.findOne({_id:id})
    const products = await Product.find()
    const wishlist = await Wishlist .findOne({user:req.session.user_id});
    const cart = await Cart.findOne({owner:req.session.user_id})
    res.render('productdetails',{products,product,wishlist,cart})
  }
  catch(error){
    console.log(error.message)
    res.status(500).send('Internal Server Error');
  }
}

const shopload = async (req, res) => {
  try {
    let sortOptions = req.query.sortOptions;
    let sortQuery = {};

    switch (sortOptions) {
      case 'popularity':
        sortQuery = { popularity: -1 };
        break;
      case 'priceLowToHigh':
        sortQuery = { price: 1 };
        break;
      case 'priceHighToLow':
        sortQuery = { price: -1 };
        break;
      case 'averageRating':
        sortQuery = { averageRating: -1 };
        break;
      case 'newness':
        sortQuery = { _id: -1 };
        break;
      case 'productNameAZ':
        sortQuery = { productname: 1 };
        break;
      case 'productNameZA':
        sortQuery = { productname: -1 };
        break;
      default:
        sortQuery = { _id: -1 };
    }

    let categoryFilter = {};
    const categoryName = req.query.categoryOptions;
    if (categoryName) {
      const category = await Category.findOne({ name: categoryName });
      if (category) {
        categoryFilter = { category: category._id };
      }
    }

    const category = await Category.find();
    let product = await Product.find(categoryFilter).sort(sortQuery);
    const wishlist = await Wishlist .findOne({user:req.session.user_id});
   const cart = await Cart.findOne({owner:req.session.user_id})

    res.render('shop', { product, category,wishlist,cart });
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal server error');
  }
};




const useraccountload = async (req,res)=>{
  try{
    const id= req.session.user_id
    const order = await Order.find({ user: id }).sort({ createdAt: -1 });

    const address = await Address.find({user:id});
    const user = await User.findOne({_id:id})
   const wallet = await Wallet.findOne({user:req.session.user_id});
   const wishlist = await Wishlist .findOne({user:req.session.user_id});
   const cart = await Cart.findOne({owner:req.session.user_id})
  res.render('useraccount',{user,address,order,wallet,cart,wishlist})
  }
  catch(error){
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
}

const edituseraccountload = async(req,res)=>{
  try{
    
    const id = req.session.user_id
    const wishlist = await Wishlist .findOne({user:req.session.user_id});
   const cart = await Cart.findOne({owner:req.session.user_id})
    const user = await User.findOne({_id:id})
  res.render('edituseraccount',{user,wishlist,cart})
  }
  catch(error){
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
}

const edituseraccount = async(req,res)=>{
  try{
    
  const id = req.session.user_id;
   await User.findByIdAndUpdate({_id:id},
    {$set:{
      name:req.body.name,
      email:req.body.email,
      phone:req.body.phone,

     }});
     res.redirect('/useraccount')
  }
  catch(error){
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
}

const addaddress = async (req,res)=>{
  try{
    const id= req.session.user_id
    const user = await User.findOne({_id:id});
    const wishlist = await Wishlist .findOne({user:req.session.user_id});
   const cart = await Cart.findOne({owner:req.session.user_id})
  res.render('addaddress',{user,wishlist,cart})
  }
  catch(error){
    console.log(error.message);
    res.status(500).send('Internal Server Error');

  }

}

const addressload = async (req,res)=>{
  try{
    const id = req.session.user_id
    const address = await Address.find({user:id});
    const wishlist = await Wishlist .findOne({user:req.session.user_id});
    const cart = await Cart.findOne({owner:req.session.user_id})
  res.render('address',{address,wishlist,cart})
  }
  catch(error){
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
}


const insertaddress = async (req, res) => {
  try {
      const id = req.session.user_id;
      const address = new Address({
          user: id,
          addresses: {
              HouseNo: req.body.HouseNo,
              Street: req.body.Street,
              Landmark: req.body.Landmark,
              pincode: req.body.pincode,
              city: req.body.city,
              district: req.body.district,
              State: req.body.State,
              Country: req.body.Country,
              addressType: req.body.addressType
          }
      });

      const addressData = await address.save();

      if (addressData) {
          res.redirect('/useraccount');
      } else {
          res.redirect('/addaddress');
          res.render('addaddress',{message:'address not added'})
      }
  } catch (error) {
      console.error("Error inserting address:", error);
      
  }
}


const editaddress =async(req,res)=>{
  try{
    const id = req.query.id;
   
    const address = await Address.findOne({_id:id});
    const wishlist = await Wishlist .findOne({user:req.session.user_id});
   const cart = await Cart.findOne({owner:req.session.user_id})
    res.render('editaddress',{address,wishlist,cart})
  }
  catch(error){
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
}

 const editaddresscheckout  =async(req,res)=>{
  try{
    const id = req.query.id;
   
    const address = await Address.findOne({_id:id});
    const wishlist = await Wishlist .findOne({user:req.session.user_id});
   const cart = await Cart.findOne({owner:req.session.user_id})
    res.render('editaddresscheckout',{address,wishlist,cart})
  }
  catch(error){
    console.log(error.message)
  }
}

const updateeditaddress = async (req,res)=>{
  try{
    
  const id = req.body.id;
  

  const address = await Address.findByIdAndUpdate({_id:id},
   {$set: {addresses: {HouseNo: req.body.HouseNo,
    Street: req.body.Street,
    Landmark: req.body.Landmark,
    pincode: req.body.pincode,
    city: req.body.city,
    district: req.body.district,
    State: req.body.State,
    Country: req.body.Country,
    addressType: req.body.addressType},
  
  }
})

res.redirect('/useraccount')

   }
  catch(error){
    console.log(error.messages);
    res.status(500).send("Internal Server Error");
  }
}

const updateeditaddresscheckout = async (req,res)=>{
  try{
    
  const id = req.body.id;
  

  const address = await Address.findByIdAndUpdate({_id:id},
   {$set: {addresses: {HouseNo: req.body.HouseNo,
    Street: req.body.Street,
    Landmark: req.body.Landmark,
    pincode: req.body.pincode,
    city: req.body.city,
    district: req.body.district,
    State: req.body.State,
    Country: req.body.Country,
    addressType: req.body.addressType},
  
  }
})

res.redirect('/checkout')

   }
  catch(error){
    console.log(error.messages);
    res.status(500).send("Internal Server Error");
  }
}


const removeaddress = async (req,res)=>{
  try{
   
 const id = req.query.id;
 await Address.deleteOne({_id:id})
 return res.status(200).json({ success:true });
  } 
  catch(error){
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
}

const useraccountorder = async(req,res)=>{
try{
  const id = req.session.user_id;
  const order = await Order.findOne({user:id});
  const wishlist = await Wishlist .findOne({user:req.session.user_id});
   const cart = await Cart.findOne({owner:req.session.user_id})
 res.render('order',{order,wishlist,cart})
}
catch(error){
  console.log(error.message);
  res.status(500).send('Internal Server Error');
}
}


const orderdetails = async (req,res)=>{
  try{
    const orderId = req.query.id;
    const order = await Order.findOne({_id:orderId});
    const wishlist = await Wishlist .findOne({user:req.session.user_id});
   const cart = await Cart.findOne({owner:req.session.user_id})
    res.render('orderdetails',{order})
  }
catch(error){
  console.log(error.message);
  res.status(500).send('Internal Server Error');
}  
}

const orderview = async(req,res)=>{
  try{
    const orderId = req.query.id;
    const order = await Order.findOne({_id:orderId})
 res.render('orderview',{order})
  }catch(error){
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }}


  function generateoId(){
    const oId = randomstring.generate({
       length:4,
       charset:'numeric'
   
     });
     return oId;
   
   }
  
   var instance = new Razorpay({ key_id: 'rzp_test_S0n0KoYcfH03Z8', key_secret: '4zspRlSBEVt30znhYdnWTJ5L' })


  const orderpending = async(req,res)=>{
    try{
  
  const id = req.query.id;

  const orderss = await Order.findOne({_id:id});

  
  const order = await instance.orders.create({
    amount:orderss.billTotal*100,
    currency: "INR",
    receipt:orderss._id
  });
  
  
  res.json({status: "success", order: order});
  
    }catch(error){
      console.log(error.message);
      res.status(500).send('Internal Server Error');
    }
  }
  

  const updatepayment = async (req, res) => {
    try {
        
        const razorpaySecret = "4zspRlSBEVt30znhYdnWTJ5L";
        const body = req.body.paymentData.razorpay_order_id + "|" + req.body.paymentData.razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", razorpaySecret)
            .update(body)
            .digest("hex");

        if (expectedSignature === req.body.paymentData.razorpay_signature) {
           
            const orderId = req.body.paymentData.orderId;
            const order = await Order.findByIdAndUpdate({ _id: orderId }, {
                $set: {
                    paymentStatus: 'Success',
                    status: 'Success',
                    oId: req.body.paymentData.razorpay_order_id ,
                }
            });
            await order.save();
            res.json({success:true,message:"order added successfuly"});
        } else {
            console.log("Incorrect Signature");

        }

    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
}


  

  const cancelorder = async (req, res) => {
    try {
      
      const { id, reason } = req.body;
      const order = await Order.findById({_id:id});
      if(order.paymentStatus == 'Success'){
        const updatedOrder = await Order.findByIdAndUpdate(id,
          { status: 'Canceled', reason: reason },
          { new: true }
        );
      
        let wallet = await Wallet.findOne({ user: req.session.user_id });
        if (!wallet) {
          wallet = await Wallet.create({ user: req.session.user_id });
        }
  
        wallet.user = req.session.user_id
        wallet.balance += order.billTotal;
  
      
        wallet.transactions.push({
          amount: order.billTotal,
          type: 'credit', 
        });
  
        await wallet.save();

        res.status(200).json({ success: true, message: 'Order canceled successfully', order: updatedOrder });
      }else{
      const updatedOrder = await Order.findByIdAndUpdate(id,
        { status: 'Canceled', reason: reason },
        { new: true }
      );
      res.status(200).json({ success: true, message: 'Order canceled successfully', order: updatedOrder });
    }
  
     
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  
const returnorder = async(req,res)=>{
  try{

    const { id, reason } = req.body;
    const order = await Order.findById({_id:id});
    if(order.paymentStatus == 'Success'){
    
 
  order.requests.push({ type: 'Return', reason: reason, status: 'Pending' });
  await order.save();

  return res.status(200).json({ message: 'Reason added and status updated successfully' });
}
  }
  catch(error){
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
}

  const wishlistload = async(req, res) => {
    try {
    
      const userId = req.session.user_id;
      const productId = req.query.id;
  
      let wishlist = await Wishlist.findOne({ user: userId });
  
      if (!wishlist) {
        wishlist = new Wishlist({
          user: userId,
          product: [(productId)]
        });
      } else {
        wishlist.user = userId;
        if (!wishlist.product.includes(productId)) {
          wishlist.product.push(productId); 
        } else {
          return res.status(400).json({ success: false, message: "Product already exists in wishlist." });
        }
      }
      await wishlist.save();
      res.status(200).json({ success: true, message: "Product added to wishlist." }); 
    } catch (error) {
      console.log(error);
      res.status(500).json({ success: false, message: "Internal server error." }); 
    }
  }
  

  

const wishlist = async(req,res)=>{
  try{
    
     
        const id=req.session.user_id;
const wishlist = await Wishlist.findOne({user:id}).populate({path:"product",model:"Product"});


   const cart = await Cart.findOne({owner:req.session.user_id})
res.render('wishlist',{wishlist,cart})
  }
  catch(error){
    console.log(error);
    res.status(500).send('Internal Server Error');
  }
}



const deletewishlistitem = async(req,res)=>{
  try{
    const id = req.query.id;
 

    const wishlist = await  Wishlist.findOne({ user: req.session.user_id });

    if (wishlist) {
      const itemIndex = wishlist.product.findIndex(item => item.toString() === id);

      if (itemIndex !== -1) {
       
        wishlist.product.splice(itemIndex, 1);
         await wishlist.save();

        return res.status(200).json({ success: true, message: "Item deleted successfully" });
      } else {
        console.log('Item not found in the wishlist');
        return res.status(404).json({ message: "Item not found in the wishlist" });
      }
    } else {
      return res.status(404).json({ message: "item not found" });
    }
  }catch(error){
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
}




const invoicedownload = async (req, res) => {
  try {

    const orderId = req.query.id;
    const order = await Order.findOne({ _id: orderId }).populate({ path: 'user', model: "User" });
   
    const data = {
      "documentTitle": "INVOICE", 
      "currency": "INR",
      "taxNotation": "gst", 
      "marginTop": 25,
      "marginRight": 25,
      "marginLeft": 25,
      "marginBottom": 25,
      "logo": "https://public.easyinvoice.cloud/img/logo_en_original.png", 
      "background": "https://public.budgetinvoice.com/img/watermark_draft.jpg", 
      "sender": {
          "company": "N",
          "address": "Cherthala, Alappuzha, Kerala",
          "zip": "987654",
          "city": "Cherthala",
          "country": "India" 
      },
      "client": {
          "company": order.user.name, 
          "address": order.deliveryAddress.Street, 
          "zip": order.deliveryAddress.pincode,
          "city": order.deliveryAddress.city,
          "country": order.deliveryAddress.Country 
      },
    
    
      "products": order.items.map(item => ({
        "description": item.name,
        "quantity": item.quantity,
        "price": item.price,
       
    }))
    ,
    "information": {
    
    
      "date": order.updatedAt.toLocaleDateString('en-US', { timeZone: 'UTC' })
  },
  
       
     
  };

  const result = await easyinvoice.createInvoice(data); 

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=myInvoice.pdf');
  res.send(Buffer.from(result.pdf, 'base64')); 


  } catch (error) {
    console.error("Error generating invoice:", error);
    res.status(500).json({ error: "Failed to generate invoice" });
  }
};






module.exports={
  securePassword,
  sendOTP,
  loadRegister,
  initialinsertUser,
   otpload,
  insertuser,
  loginload,
  verifyLogin,
  loadhome,
  productdetailspage,
  logouts,
  resendandinsert,
  shopload,
useraccountload,
addressload,
addaddress,
insertaddress,
edituseraccountload,
edituseraccount,
useraccountorder,
editaddress,
updateeditaddress,
removeaddress,
updateeditaddresscheckout,
orderdetails,
orderview,
cancelorder,
editaddresscheckout,
wishlistload,
wishlist,
deletewishlistitem,
invoicedownload,
orderpending,
updatepayment,
googleSignIn,
returnorder

}
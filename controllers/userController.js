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


const securePassword = async(password)=>{
  try{
   
    const passwordHash= await bcrypt.hash(password,10);
    return passwordHash;

  }catch(error){
    console.log(error.message);
  }
 }

 const logouts = async (req,res)=>{
  try{
    req.session.user_id=false ;
    req.session.isblocked= true;
    res.redirect('/login')
  }
  catch(error){
    console.log(error.message)
  }

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
     console.log(error)
 
   }
 }





 
 const loadRegister=async(req,res)=>{
  try{
    res.render('registration.ejs');

  }catch(error){
    console.log(error.message)
  }
}







const initialinsertUser = async (req, res) => {
  try {
    console.log('djbdskjfdshf')
    console.log(req.body)
    if (!req.body) {
      throw new Error('No data received');
    }
  
    const { name, email, phone, password } = req.body;
   
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
    
    if (existingUser) {
      if (existingUser.email === email && existingUser.phone == phone) {
        return res.render("registration", {message:"Email and phone number is already registered"});
      }
       else if (existingUser.email == email) {
        return res.render("registration", { message: "Email is already registered" });
      } else if (existingUser.phone == phone) {
        return res.render("registration", { message: "Phone number is already registered" });
      }
    } else {
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
        phone: phone
      };
      console.log('redirect')
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
    console.log(error.message)
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
    if(req.body.otp==userOTP){
      const user = new User({
      name:req.session.userData.name,
      email:req.session.userData.email,
      phone:req.session.userData.phone,
      password:req.session.userData.password,
      is_admin:0,
      isBlocked:false,
    
    });
   await user.save();
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
      console.log(error.message)
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
        console.log("error2")
      }

    }else{
      res.render('login',{message:'email is not excisting'})
      console.log("error122222")
    }
   

  }catch(error){
    console.log(error.message)
  }
}




const loadhome = async(req,res)=>{
  try{
    const isBlocked = false;
    const product = await Product.find({isBlocked:isBlocked})
    res.render('home',{product})
   

  }catch(error){
    console.log(error.message)
  }
}




const productdetailspage = async(req,res)=>{
  try{
    const product = await Product.find()
 
    res.render('productdetails',{product})
  }
  catch(error){
    console.log(error.message)
  }
}

const shopload = async(req,res)=>{
  try{
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
   const category =  await Category.find();
    const product = await Product.find().sort(sortQuery);
 
   res.render('shop',{product,category})
  }
  catch(error){
    console.log(error.message)
  }
}

const useraccountload = async (req,res)=>{
  try{
    const id= req.session.user_id
   const order = await Order.find({user:id})
    const address = await Address.find({user:id});
    const user = await User.findOne({_id:id})
   
  res.render('useraccount',{user,address,order})
  }
  catch(error){
    console.log(error.message)
  }
}

const edituseraccountload = async(req,res)=>{
  try{
    console.log(req.session.user_id)
    const id = req.session.user_id
    
    const user = await User.findOne({_id:id})
  res.render('edituseraccount',{user})
  }
  catch(error){
    console.log(error.message)
  }
}

const edituseraccount = async(req,res)=>{
  try{
    console.log(req.query.id)
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
    console.log(error.message)
  }
}

const addaddress = async (req,res)=>{
  try{
    const id= req.session.user_id
    const user = await User.findOne({_id:id})
  res.render('addaddress',{user})
  }
  catch(error){
    console.log(error.message)

  }

}

const addressload = async (req,res)=>{
  try{
    const id = req.session.user_id
    const address = await Address.find({user:id});
    console.log(address)
  res.render('address',{address})
  }
  catch(error){
    console.log(error.message)
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
    console.log(id)
    const address = await Address.findOne({_id:id});
    res.render('editaddress',{address})
  }
  catch(error){
    console.log(error.message)
  }
}

 const editaddresscheckout  =async(req,res)=>{
  try{
    const id = req.query.id;
    console.log(id)
    const address = await Address.findOne({_id:id});
    res.render('editaddresscheckout',{address})
  }
  catch(error){
    console.log(error.message)
  }
}

const updateeditaddress = async (req,res)=>{
  try{
    
  const id = req.body.id;
  console.log(id);

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
console.log('jbdckjsdjbvksdv')
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
  console.log(id);

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
console.log('jbdckjsdjbvksdv')
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
  const order = await Order.findOne({user:id})
 res.render('order',{order})
}
catch(error){
  console.log(error.message)
}
}


const orderdetails = async (req,res)=>{
  try{
    const orderId = req.query.id;
    const order = await Order.findOne({_id:orderId})
    res.render('orderdetails',{order})
  }
catch(error){
  console.log(error.message)
}  
}

const orderview = async(req,res)=>{
  try{
    const orderId = req.query.id;
    const order = await Order.findOne({_id:orderId})
 res.render('orderview',{order})
  }catch(error){
    console.log(error.message)
  }}

  const cancelorder = async(req,res)=>{
    try{
     console.log('kdbksfbfk')
      const { id, reason } = req.body;
      const order = await Order.findById({_id:id});
  
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
  
    
      
      order.reason = reason;
      await order.save();
      order.requests.push({ type: 'Cancel', status: 'Pending', reason });
      await order.save();
  
      res.status(200).json({ success:true,message: 'cancel request is send' });
    }catch(error){
      console.log(error.message)
    }
  }


  const wishlistload = async(req, res) => {
    try {
      console.log('vbsgjsbffsjbkj');
      console.log( req.query.id)
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
    
        //   const unwindedWishlist = await Wishlist.aggregate([
        //       { $unwind: "$product" }
        //   ]);
        //  console.log(unwindedWishlist);
        const id=req.session.user_id;
const wishlist = await Wishlist.findOne({user:id}).populate({path:"product",model:"Product"});


res.render('wishlist',{wishlist})
  }
  catch(error){
    console.log(error)
  }
}



const deletewishlistitem = async(req,res)=>{
  try{
    const id = req.query.id;
    console.log(id)

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
    console.log(error.message)
  }
}







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
deletewishlistitem

}
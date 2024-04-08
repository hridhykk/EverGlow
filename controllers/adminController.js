
const session = require('express-session');
const Admins = require('../models/adminModel');
const User=require('../models/userModel');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const Coupon = require('../models/couponModel');




const loginLoad = async(req,res)=>{
  try{
   res.render('adminlogin')
  }
  catch(error){
    console.log(error.message)
  }
}


const verifyadminLogin = async(req,res)=>{
  try{
const email = req.body.email;
const userpassword = req.body.password;
const userData = await Admins.findOne({email:email})
if(userData){
  if(userData.password === userpassword){
    req.session.admin_id = userData._id
   res.redirect('/admin/dashboard');
 
  
  }else{
    console.log("error2")
    res.render('adminlogin',{message:"email and password is incorrect"})
  }

}else{
  res.render('adminlogin',{message:"email and password is  incorrect"})
  console.log('error1')

}
  }
  catch(error){
console.log(error.message)
  }
}


const adminDashboard = async(req,res)=>{
  try{
    res.render('dashboard')

  }catch(error){
    console.log(error.message)
  }
}

const userload = async (req, res) => {
  try {
      const currentPage = parseInt(req.query.page) || 1;
      const limit = 2;
      const startIndex = (currentPage - 1) * limit;

   
      console.log(req.query.searchTerm)
      if (req.query.searchTerm) {
          const searchTerm = req.query.searchTerm;
        
          const userlist = await User.find({ $or: [{ name: { $regex: searchTerm, $options: 'i' } }, { email: { $regex: searchTerm, $options: 'i' } }] })
              .skip(startIndex)
              .limit(limit);
          const totalUsers = await User.countDocuments();
          const totalPages = Math.ceil(totalUsers / limit);
          res.render('userlist', { userlist, currentPage, totalPages });
      } else {
          
          const userlist = await User.find().skip(startIndex).limit(limit);
          const totalUsers = await User.countDocuments();
          const totalPages = Math.ceil(totalUsers / limit);
         
          res.render('userlist', { userlist, currentPage, totalPages,startIndex});
      }
  } catch (error) {
      console.log(error.message);
      res.status(500).send('Internal Server Error');
  }
}


//  const userload = async(req,res)=>{
//   try{
//     console.log(req.query.page);
//     const currentPage = parseInt(req.query.page) || 1;
//     const limit = 2; 
//     const startIndex = (currentPage - 1) * limit;
//     const userlist = await User.find().skip(startIndex).limit(limit);
//     const totalUsers = await User.countDocuments();
//     const totalPages = Math.ceil(totalUsers / limit);
//     res.render('userlist', { userlist, currentPage, totalPages });
//  }
//   catch(error){
//     console.log(error.message)
//   }

//  }
  

 
 
 const userblock = async(req,res)=>{
  try{
   
    let id = req.query.id;
    let userData = await User.findById({_id:id})
  

    if(userData.isBlocked==true){
      await User.findByIdAndUpdate({_id:id},{$set:{isBlocked:false}})
        await userData.save();
        res.redirect('/admin/user')
       }else{
        await User.findByIdAndUpdate({_id:id},{$set:{isBlocked:true}})
        await userData.save();
        res.redirect('/admin/user')
      }
  }
  catch(error){
    console.log(error.message)
  }
 } 


 const logouts = async (req,res)=>{
  try{
    req.session.user_id=false ;
    res.redirect('/admin/')
  }
  catch(error){
    console.log(error.message)
  }

 }


 const adminorderlist = async(req,res)=>{
  try{
    const order = await Order.find().populate({path:'user',model:'User'});

    res.render('adminorderlist',{order})
  
  }catch(error){
    console.log(error.message)
  }
 }

const adminorderdetails = async(req,res)=>{
  try{
    console.log('kdbksd')
    const orderId = req.query.id
    const orders = await Order.findOne({_id:orderId}).populate({path:'user',model:'User'});

    res.render('adminorderdetails',{orders})
  }
  catch(error){
    console.log(error.message)
  }
}


// const acceptcancel = async (req,res)=>{
//   try{
//     console.log('sjbsdkbsfkh')
// const oderId = req.query.id;
// await Order.findByIdAndDelete({_id:oderId},
//   {$set:{
//     status:"canceled"
    
//   }})
//   res.status(200).json({ success:true,message: 'product cancel' });
//   } catch(error){
//     console.log(error.message)
//   }
// }
const acceptcancel = async (req, res) => {
  try {
    const orderId = req.query.id;
    
    // Find the canceled order
    const canceledOrder = await Order.findOne({_id:orderId});
    
    if (!canceledOrder) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    canceledOrder.requests = canceledOrder.requests.map(request => {
      if (request.type === 'Cancel' && request.status === 'Pending') {
        return { ...request, status: 'Accepted' }; // or you can remove the request
      }
      return request;
    });

    // Iterate through the items in the canceled order
    for (const item of canceledOrder.items) {
      const productId = item.productId;
      const quantity = item.quantity;

      // Find the product and update its count in stock
      const product = await Product.findById(productId);

      if (!product) {
        console.log('Product not found for productId:', productId);
        continue; 
      }
      
      // Increase the count in stock by the quantity of the canceled order item
      product.countinstock += quantity;
      
      // Save the updated product
      await product.save();
    }

    // Set the status of the canceled order to "canceled"
    canceledOrder.status = "Canceled";
    
    // Save the updated order
    await canceledOrder.save();

    // Respond with success message
    res.status(200).json({ success: true, message: 'Product cancel: Stock updated' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const addcoupen = async(req,res)=>{
  try{
  // const coupens = await Coupen.findOne()
res.render('addcoupon')
  }catch(error){
    console.log(error.message)
  }
}


const coupenload = async(req,res)=>{
  try{
    const userId = req.session.user_id;
 const coupon= new Coupon({
  code:req.body.code,
  description:req.body.description,
  minimumAmount:req.body.minimumAmount,
  maximumAmount:req.body.maximumAmount,
  discountPercentage:req.body.discountPercentage,
  expirationDate:req.body.expirationDate,
  maxDiscountAmount:req.body.maxDiscountAmount,
  userUsed : [(userId)],
  maxUsers:req.body.maxUsers
})
await coupon.save();
res.redirect('/admincouponpage')
  }catch(error){
    console.log(error.message)
  }
}


const couponpage = async(req,res)=>{
  try{
const coupons = await Coupon.find();
res.render('admincouponpage',{coupons})
  }catch(error){
    console.log(error.message)
  }
}

const orderlist = async (req,res)=>{
  try{
    const order = await Order.find().populate({path:'user',model:'User'});
res.render('orderlist',{order})
  }catch(error){
    console.log(error.message)
  }
}




 module.exports={
  loginLoad,verifyadminLogin ,adminDashboard,userload,userblock,logouts,adminorderlist,adminorderdetails,acceptcancel,addcoupen,coupenload,couponpage,orderlist}
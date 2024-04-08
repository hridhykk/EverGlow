const session = require('express-session');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');

const path = require("path");



const productload = async(req,res)=>{
  try{
    
    const currentPage = parseInt(req.query.page)||1;
    const limit = 5;
    const startIndex = (currentPage-1)*limit;
    const totalproduct = await Product.countDocuments();
    const totalPages = Math.ceil(totalproduct/limit);
    const product = await Product.find().populate('Category').sort({ createdAt:1}).skip(startIndex).limit(limit);
    const reversedProduct = product.reverse();
    res.render('product',{product: reversedProduct,currentPage,totalPages, startIndex })

  }
  catch(error){
    console.log(error.message)
}
}




const productadd = async(req,res)=>{
  try{
    const category = await Category.find()
    res.render('addproduct',{category})

  }
  catch(error){
    console.log(error.message)
 }
 }


 
 const insertproduct = async(req,res)=>{
  try{
console.log('insertproduct')
    const images = req.files.map(files => files.filename);
      
    const product = new Product({
    productname: req.body.productname,
    description: req.body.description,
    brand: req.body.brand,
    price: req.body.price,
    countinstock: req.body.countinstock,
    category: req.body.category,
    images:images,
    isBlocked:false,
 })
  const userData = await product.save()
  res.redirect('/admin/product')


  }catch(error){
    console.log(error.message)
  }
 }

 const loadeditproduct = async(req,res)=>{
  try{
   
    const id = req.query.id;
    console.log(id)
    const category = await Category.find()
    const product = await Product.findById(id)

    console.log(product)
    if(product){
      
      res.render('editproduct',{category,product}) 
    }else{
      res.redirect('/admin/product')
    }
   
  }
  catch(error){
    console.log(error.message)
  }
 }




 const editproductpage = async(req,res)=>{
  try{
    


     const id = req.query.id;
    
     const imageFileNames = req.files.map(file => file.filename);
    await Product.findByIdAndUpdate({_id:id},

      {$set:{
    productname: req.body.productname,
    description: req.body.description,
    brand: req.body.brand,
    price: req.body.price,
    countinstock: req.body.countinstock,
    category: req.body.category,
    images:imageFileNames
   
  }})
 
 
   res.redirect('/admin/product')

  }catch(error){
    console.log(error.message)
  }
 }



 const deleteproduct = async(req,res)=>{

  try{
    let id = req.query.id;
    let userData = await Product.findById({_id:id})
  

    if(userData.isBlocked==true){
      await Product.findByIdAndUpdate({_id:id},{$set:{isBlocked:false}})
        await userData.save();
        res.redirect('/admin/product')
       }else{
        await Product.findByIdAndUpdate({_id:id},{$set:{isBlocked:true}})
        await userData.save();
        res.redirect('/admin/product')
      } ;
    }
  catch(error){
    console.log(error.message)
  }
 }




 module.exports={
  productload,productadd,insertproduct,editproductpage,deleteproduct,loadeditproduct}
const session = require('express-session');
const Category = require('../models/categoryModel');
const Product = require('../models/productModel');
const { check, validationResult } = require("express-validator")


    

const categoryload = async(req,res)=>{
  try{
    
    const currentPage = parseInt(req.query.page) || 1;
    const limit = 3;
    const startIndex =(currentPage -1)*limit;
    const category = await Category.find().skip(startIndex).limit(limit);
    const totalcategory = await Category.countDocuments();
    const totalPages = Math.ceil(totalcategory/limit)
    const count=1;
      res.render('category',{category,totalPages,currentPage,startIndex});

  }
  catch(error){
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
 }


 const addcategorypage = async(req,res)=>{
  try{
   
    res.render('addcategory',{message:null})

  }
  catch(error){
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
 }


 const insertcategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    const existingcate = await Category.findOne({ name: name.toLowerCase() });
    if (existingcate) {
     
      return res.render('addcategory', {  message: 'Name is already entered' });
    }

    const categorys = new Category({ name, description });
    const savedCategory = await categorys.save();
    

    if (savedCategory) {
      return res.redirect('/admin/category');
    } else {
      return res.render('addcategory', { message: 'Failed to insert category' });
    }
  } catch (error) {
    console.error(error.message);
    return res.status(500).send('Internal Server Error');
  }
};





 const editcategorypage = async(req,res)=>{
  try{
    const id = req.query.id;
    const userData = await Category.findById({_id:id});
    if(userData){
    res.render('editcategory',{category:userData});
  }else{
    res.redirect('/admin/category');
  }
  }
  catch(error){
    console.log(error.message)

  }
 }
 
 
 const updatecategory = async(req,res)=>{
  try{
    const id = req.query.id;
    
   await Category.findByIdAndUpdate({ _id:id},
    {$set:{name:req.body.name,
      description:req.body.description,
      is_active:1 }});
  res.redirect('/admin/category');
}
  catch(error){
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
 }



 const deletecategory = async(req,res)=>{
  try{
    const id = req.query.id;
    await Category.deleteOne({_id:id})
    res.redirect('/admin/category')

  }
  catch(error){
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
 }



 const categoryofferpage = async(req,res)=>{
  try{
    const category = await Category.find();
    const currentDate = new Date();
 res.render('categoryofferpage',{category,currentDate})
  }catch(error){
    console.log(error.message);
    res.status(500).send('Internal Server Error');

  }
 }
 const categoryoffer = async (req, res) => {
  try {
      const discountPercentage = req.body.discountPercentage;
      const expirationDate = req.body.expirationDate;
      const id = req.body.id;
    
  
       await  Category.findByIdAndUpdate({_id:id},{$set:{categoryofferApplied:true,categoryofferexp:expirationDate,categorydiscountPercentage:discountPercentage}})
      const products = await Product.find({ category: id });
      
      if (products.length > 0) {
          for (const product of products) {
              const originalPrice = product.price;
              const discountAmount = (originalPrice * discountPercentage) / 100;
              const price = originalPrice - discountAmount;
            
              product.categoryofferPrice = price;
              product.categoryofferexp = expirationDate;
              product.categoryofferApplied = true;

              await product.save();
          }

          res.redirect('/admin/categoryo[path.length - 1]offerpage');
      } else {
          res.status(404).send("Products not found for the given category");
      }
  } catch (error) {
      console.log(error.message);
      res.status(500).send("Internal Server Error");
  }
}


const removecategoryoffer = async(req,res)=>{
  try{
   
    const id = req.query.id;
    
 await Category.findByIdAndUpdate({_id:id},{$set:{
  categoryofferApplied:false,
 
  categorydiscountPercentage:0
  
 }});
 res.json({success:true});
  }catch(error){
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
}


module.exports={
 categoryload,addcategorypage,insertcategory,editcategorypage,updatecategory,deletecategory,categoryofferpage,categoryoffer,removecategoryoffer}
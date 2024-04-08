const session = require('express-session');
const Category = require('../models/categoryModel');

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
    console.log(error.message)
  }
 }


 const addcategorypage = async(req,res)=>{
  try{
   
    res.render('addcategory',{message:null})

  }
  catch(error){
    console.log(error.message)
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
    console.log(savedCategory);

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



// const insertcategory = async(req,res)=>{
//   try{
    
//  const productcategory = new Category({
//   name:req.body.name,
//   description:req.body.description,
//   is_active:0

//   })

//   const Data = await productcategory.save()
//   res.redirect('/admin/category')
  
//   }
//   catch(error){
//     console.log(error.message)
//   }
// }

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
    console.log(req.query.id);
   await Category.findByIdAndUpdate({ _id:id},
    {$set:{name:req.body.name,
      description:req.body.description,
      is_active:1 }});
  res.redirect('/admin/category');
}
  catch(error){
    console.log(error.message)
  }
 }



 const deletecategory = async(req,res)=>{
  try{
    const id = req.query.id;
    await Category.deleteOne({_id:id})
    res.redirect('/admin/category')

  }
  catch(error){
    console.log(error.message)
  }
 }

module.exports={
 categoryload,addcategorypage,insertcategory,editcategorypage,updatecategory,deletecategory}
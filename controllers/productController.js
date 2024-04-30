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


 
 const insertproduct = async (req, res) => {
  try {
    const category = await Category.findOne({ _id: req.body.category });

    const images = req.files.map((file) => file.filename);

    const product = new Product({
      productname: req.body.productname,
      description: req.body.description,
      brand: req.body.brand,
      price: req.body.price,
      countinstock: req.body.countinstock,
      category: req.body.category,
      images: images,
      isBlocked: false,
    });

    // Check if the category has an active offer
    if (category.categoryofferApplied) {
      // Calculate offer price based on the provided formula
      const originalPrice = req.body.price;
      const discountPercentage = category.categorydiscountPercentage; // Assuming category has discountPercentage property
      const discountAmount = (originalPrice * discountPercentage) / 100;
      const offerPrice = (originalPrice - discountAmount);

      // Apply category offer to the product
      product.categoryofferPrice = offerPrice;
      product.categoryofferexp = category.categoryofferexp;
      product.categoryofferApplied = true;
    }

    await product.save();
    res.redirect('/admin/product');
  } catch (error) {
    console.log(error.message);
  }
};


 const loadeditproduct = async(req,res)=>{
  try{
   
    const id = req.query.id;
    
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





//  const editproductpage = async(req,res)=>{
//   try{
    


//      const id = req.query.id;
//      let existingImages = [];
//      let newImages = [];
//             if (req.files && Array.isArray(req.files)) {
//               newImages = req.files.map(file => file.filename);
//           }
//           const allImages = existingImages.concat(newImages);
//   // const imageFileNames = req.files.map(file => file.filename);
//     await Product.findByIdAndUpdate({_id:id},

//       {$set:{
//     productname: req.body.productname,
//     description: req.body.description,
//     brand: req.body.brand,
//     price: req.body.price,
//     countinstock: req.body.countinstock,
//     category: req.body.category,
//     images:allImages
   
//   }})
 
 
//    res.redirect('/admin/product')

//   }catch(error){
//     console.log(error.message)
//   }
//  }


//  
// const editproductpage = async (req, res) => {
//   try {

//       let existingImages = [];
//       const existingProduct = await Product.findById(req.query.id);
//       const categorydetails = await Category.find();

//       // Existing images are retained unless new images are uploaded
//       if (existingProduct && existingProduct.images && Array.isArray(existingProduct.images)) {
//           existingImages = existingProduct.images;
//       }
//       console.log(req.body);
//       let newImages = [];
//       // Process new images if any
//       if (req.files && req.files.length) {
//           newImages = req.files.map(file => file.filename);
//       }

//       const allImages = existingImages.concat(newImages);

//           const updatedProduct = await Product.findByIdAndUpdate(req.query.id, {
//               $set: {
//                 productname: req.body.productname,
//                     description: req.body.description,
//                     brand: req.body.brand,
//                     price: req.body.price,
//                     countinstock: req.body.countinstock,
//                     category: req.body.category,
//                     images:allImages
//               }
//           }, { new: true }); // {new: true} to return the updated object

//           if (updatedProduct) {
//               return res.redirect('/admin/product');
//           }
    
//   } catch (error) {
//       console.log('update product:', error.message);
//       res.status(500).send('An error occurred');
//   }
// };



const editproductpage = async (req, res) => {
  try {
      let existingImages = [];
      let existingProduct = await Product.findById(req.query.id);
     

      

      if (existingProduct && existingProduct.images && Array.isArray(existingProduct.images)) {
          existingImages = existingProduct.images;
      }

      let newImages = [];
    
      if (req.files && req.files.length) {
          newImages = req.files.map(file => file.filename);
      }

      const allImages = existingImages.concat(newImages);

    
      
          const updatedProduct = await Product.findByIdAndUpdate(req.query.id, {
              $set: {
                  name: req.body.name,
                  description: req.body.description,
                  images: allImages,
                  category: req.body.category,
                  price: req.body.price,
                  discountPrice: req.body.discountPrice,
                  countInStock: req.body.stock,
              }
          }, { new: true }); 

          if (updatedProduct) {
              return res.redirect('/admin/product');
          }
      
  } catch (error) {
      console.log('update product:', error.message);
      res.status(500).send('An error occurred');
    }
};




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


const productofferpage = async (req,res)=>{
  try{
    const product = await Product.find();
    const currentDate = new Date();
res.render('productoffer',{product,currentDate})
  }catch(error){
    console.log(error.message)
  }
}
  

const productoffer = async (req, res) => {
  try {
    const discountPercentage = req.body.discountPercentage;
    const expirationDate = req.body.expirationDate;
    const originalPrice = req.body.price;
    var discountAmount = (originalPrice * discountPercentage) / 100;

    const id = req.body.id;
    
   
    const product = await Product.findOne({_id:id});
    
   const price = (originalPrice - discountAmount);
   console.log(price)
    product.offerPrice = price;
    product.offerexp = expirationDate;
    product.productofferApplied = true;
    
   
    await product.save();
    
    res.redirect('/admin/productofferpage');
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
}

const removeoffer = async(req,res)=>{
  try{
    console.log("hello2")
    const id = req.query.id;

 await Product.findByIdAndUpdate({_id:id},{$set:{
  productofferApplied:false,

  offerPrice:0
 }});
 res.json({success:true});
  }catch(error){
    console.log(error.message)
  }
}


 module.exports={
  productload,productadd,insertproduct,editproductpage,deleteproduct,loadeditproduct, productofferpage,productoffer,removeoffer}
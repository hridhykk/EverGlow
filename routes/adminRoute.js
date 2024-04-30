const express = require("express");
const admin_route=express();
const bodyParser=require("body-parser")
const path = require("path");
const session=require("express-session")
const nocache = require("nocache");
const multer = require('multer')
admin_route.set('view engine','ejs');
admin_route.set('views', './views');

admin_route.use(nocache());
admin_route.use(express.static('public'));

admin_route.use(bodyParser.json());
admin_route.use(bodyParser.urlencoded({extended:true}));
const config = require(path.join(__dirname, "../config/config"));
admin_route.use(session({secret:config.sessionSecret,resave:false,saveUninitialized:true}));

const adminController=require('../controllers/adminController'); 
const categoryController=require('../controllers/categoryController');     
const productController=require('../controllers/productController');  
const storage=multer.diskStorage({
  destination:function(req,file,cb){
    cb(null,path.join(__dirname,'../public/userImages'))

  },
  filename:function(req,file,cb){
    const name= Date.now()+'-'+file.originalname;
    cb(null,name);

  }
})
const upload = multer({storage:storage});

    
const {isLogin,isLogout } =  require('../middleware/adminauth');

admin_route.get('/', isLogout, adminController.loginLoad);


admin_route.post('/adminlogin',adminController.verifyadminLogin);
admin_route.get('/dashboard',isLogin,adminController.adminDashboard);
admin_route.get('/product',isLogin,productController.productload);
admin_route.get('/addproduct',isLogin,productController.productadd);
admin_route.post('/addproduct',upload.array('images',3),productController.insertproduct);
admin_route.get('/editproduct',isLogin,productController.loadeditproduct);
admin_route.post('/editproduct',upload.array('images',3),productController.editproductpage);
admin_route.get('/deleteproduct',isLogin,productController.deleteproduct);


admin_route.get('/category',isLogin,categoryController.categoryload);
admin_route.get('/addcategory',isLogin,categoryController.addcategorypage);
admin_route.post('/addcategory',categoryController.insertcategory);
admin_route.get('/editcategory',isLogin,categoryController.editcategorypage);
admin_route.post('/editcategory',categoryController.updatecategory);
admin_route.get('/deletecategory',isLogin,categoryController.deletecategory);
admin_route.get('/user',isLogin,adminController.userload);
admin_route.get('/userblock',isLogin,adminController.userblock)
admin_route.get('/logouts',adminController.logouts)
admin_route.get('/adminorderlist',isLogin,adminController.adminorderlist);
admin_route.get('/adminorderdetails',isLogin,adminController.adminorderdetails);
admin_route.post('/updateOrderStatus',isLogin,adminController.updateOrderStatus);
admin_route.post('/acceptcancel',isLogin,adminController.acceptcancel);
admin_route.get('/addcoupen',isLogin,adminController.addcoupen);
admin_route.post('/addcoupen',isLogin,adminController.coupenload);
admin_route.get('/couponpage',isLogin,adminController.couponpage);
admin_route.get('/orderlist',isLogin,adminController.orderlist);
admin_route.get('/pdfreport',isLogin,adminController.pdfreport);
admin_route.get('/excel',isLogin,adminController.excel);
admin_route.get('/productofferpage',isLogin,productController.productofferpage);
admin_route.post('/productoffer',isLogin,productController.productoffer);
admin_route.post('/removeoffer',isLogin,productController.removeoffer);
admin_route.get('/categoryofferpage',isLogin,categoryController.categoryofferpage);
admin_route.post('/categoryofferpage',isLogin,categoryController.categoryoffer);
   
admin_route.post('/removecategoryoffer',isLogin,categoryController.removecategoryoffer);

admin_route.get('/inactivecoupon',isLogin,adminController.inactivecoupon);
admin_route.get('/editcoupon',isLogin,adminController.loadeditcoupon);

admin_route.post('/editcoupon',isLogin,adminController.editCouponPage);
module.exports= admin_route;

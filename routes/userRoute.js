const express = require("express");
const user_route = express();
const bodyParser=require("body-parser")
const path = require("path");
const nocache = require("nocache")
const session=require("express-session");
const multer=require("multer")

const userController=require('../controllers/userController');
const config = require(path.join(__dirname, "../config/config"));
user_route.use(session({secret:config.sessionSecret}));
const cartController=require('../controllers/cartController'); 

user_route.use(nocache());
user_route.set('view engine','ejs');
user_route.set('views', './views');
user_route.use(express.static('public'));
user_route.use(bodyParser.json());
user_route.use(bodyParser.urlencoded({ extended: true }));
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
const {logSession,isLogout} =  require('../middleware/auth');
 const {isblocked} =  require('../middleware/isblocked');

require('../passport');
const passport = require('passport');
user_route.use(passport.initialize());
user_route.use(passport.session());


function isLoggedin(req, res, next) {
    req.user ? next() : res.sendStatus(401);
}


// user_route.use(cookieParser());

user_route.get('/auth/google',
    passport.authenticate('google', { scope: ['email', 'profile'] })
);

user_route.get('/auth/google/callback',
    passport.authenticate('google', {
        successRedirect: '/google-sign-in',
        failureRedirect: '/auth/google/failure'
    })
);

user_route.get('/auth/google/failure', isLoggedin, (req, res) => {
    console.log(session.user);
    res.redirect('/login');
})




user_route.get('/google-sign-in',userController.googleSignIn);
user_route.get('/register',isLogout,userController.loadRegister);
user_route.post('/register',userController.initialinsertUser);

user_route.get('/otp',isLogout,userController.otpload);
user_route.post('/otp',userController.insertuser);
user_route.get('/resendotp',isLogout,userController.resendandinsert);
user_route.get('/login',isLogout,userController.loginload);
user_route.get('/logout',userController.logouts)
user_route.post('/login',userController.verifyLogin);
user_route.get('/home',isblocked,logSession,userController.loadhome);
user_route.get('/productdetails',logSession, userController.productdetailspage);
user_route.get('/shop',logSession,userController.shopload);
user_route.get('/useraccount',logSession,userController.useraccountload);
user_route.get('/address',logSession,userController.addressload);
user_route.get('/addaddress',logSession,userController.addaddress);
user_route.post('/addaddress',logSession,userController.insertaddress);
user_route.get('/edituseraccount',logSession,userController.edituseraccountload);
user_route.post('/edituseraccount',logSession,userController.edituseraccount);
user_route.get('/orderdetails',logSession,userController.orderdetails);
user_route.get('/orderview',logSession,userController.orderview);
user_route.post('/orderpending',logSession,userController.orderpending);
user_route.post('/updatepayment',logSession,userController.updatepayment);

user_route.post('/cancelorder',logSession,userController.cancelorder);

// user_route.post('/insertcart',logSession,userController.inserder);
// user_route.post('/insertcart',logSession,userController.insertcart);
user_route.post('/cart',logSession,cartController.cartload);
user_route.get('/cartpage',logSession,cartController.cartpageload);
user_route.get('/deletecartitem',logSession,cartController.deletecartitem);
user_route.post('/updateQuantity',logSession,cartController.updateQuantity);
user_route.get('/checkout',logSession,cartController.checkoutpage);
user_route.post('/order',logSession,cartController.orderload);
user_route.post('/orderonlineload',logSession,cartController.orderonlineload);
user_route.post('/orderfailed',logSession,cartController.orderfailed);

user_route.get('/ordersuccess',logSession,cartController.ordersuccess);
user_route.get('/useraccountorder',logSession,userController.useraccountorder);
user_route.get('/editaddress',logSession,userController.editaddress);
user_route.get('/editaddresscheckout',logSession,userController.editaddresscheckout);
user_route.post('/updateeditaddress',logSession,userController.updateeditaddress);
user_route.post('/removeaddress',logSession,userController.removeaddress);
user_route.post('/updateeditaddresscheckout',logSession,userController.updateeditaddresscheckout);
user_route.get('/wishlist',logSession,userController.wishlist);
user_route.post('/wishlistload',logSession,userController.wishlistload);
user_route.get('/deletewishlistitem',logSession,userController.deletewishlistitem);
user_route.post('/checkcoupon',logSession,cartController.checkcoupon);
user_route.post('/removecoupon',logSession,cartController.removecoupon);
user_route.post('/returnorder',logSession,userController. returnorder);



user_route.get('/invoice',logSession,userController.invoicedownload);
user_route.get('/',logSession,userController.shopload);




module.exports = user_route;
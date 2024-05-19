require('dotenv').config()
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGODB);
const session=require("express-session")
const express = require("express");
const path = require("path");
const app = express();
const bodyParser=require("body-parser")
const nocache = require("nocache")


app.set('view engine','ejs');
app.set('views', './views');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const config = require(path.join(__dirname, "./config/config"));
app.use(session({secret:config.sessionSecret,resave:false,saveUninitialized:true}))

const userRoutePath = path.join(__dirname, 'routes', 'userRoute.js');
const userRoute = require(userRoutePath);
app.use('/', userRoute);

const adminRoutePath = path.join(__dirname, 'routes', 'adminRoute.js');
const adminRoute = require(adminRoutePath);
app.use('/admin', adminRoute);



// app.listen(1111, function() {
//   console.log("Server is running...........");
// });
  
const PORT = process.env.PORT || 1111
app.listen(PORT, () => {
  console.log("Server is running...........")
})



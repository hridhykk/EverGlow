
const session = require('express-session');
const Admins = require('../models/adminModel');
const User=require('../models/userModel');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const Coupon = require('../models/couponModel');

const fs = require('fs');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');


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

const adminorderlist = async (req, res) => {
  try {
    const currentPage = parseInt(req.query.page) || 1;
    const limit = 8;
    const startIndex = (currentPage - 1) * limit;
    const totalOrders = await Order.countDocuments();
    const totalPages = Math.ceil(totalOrders / limit);
    const order = await Order.find().populate({ path: 'user', model: 'User' }).skip(startIndex).limit(limit);
    res.render('adminorderlist', { order, currentPage, totalPages, startIndex }); // Pass currentPage here
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Server Error');
  }
}

//  const adminorderlist = async(req,res)=>{
//   try{
//     const order = await Order.find().populate({path:'user',model:'User'});

//     res.render('adminorderlist',{order})
  
//   }catch(error){
//     console.log(error.message)
//   }
//  }

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

const updateOrderStatus = async (req, res) => {
  try {
      console.log('hi');
      const { orderId, newStatus } = req.body;
      console.log(orderId, newStatus);
      const order = await Order.findByIdAndUpdate(orderId, { status: newStatus }, { new: true });

      if (!order) {
          return res.status(404).json({ error: 'Order not found' });
      }

      return res.status(200).json({ success: true, message: 'Order status updated successfully', order: order });
  } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
  }
};


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
res.redirect('/admin/couponpage')
  }catch(error){
    console.log(error.message)
  }
}


const couponpage = async (req, res) => {
  try {
    const currentPage = parseInt(req.query.page) || 1;
    const limit = 5;
    const startIndex = (currentPage - 1) * limit;
    const totalCoupons = await Coupon.countDocuments();
    const totalPages = Math.ceil(totalCoupons / limit);
    const coupons = await Coupon.find().skip(startIndex).limit(limit);
    res.render('admincouponpage', { coupons, currentPage, totalPages, startIndex });
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Server Error');
  }
}



const orderlist = async (req, res) => {
  try {
    const currentPage = parseInt(req.query.page) || 1;
    const limit = 5;
    const startIndex = (currentPage - 1) * limit;
    const totalOrders = await Order.countDocuments();
    const totalPages = Math.ceil(totalOrders / limit);
    const order = await Order.find().populate({ path: 'user', model: 'User' }).skip(startIndex).limit(limit);
    res.render('orderlist', { order, currentPage, totalPages, startIndex }); // Pass currentPage here
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Server Error');
  }
}



// const orderlist = async (req,res)=>{
//   try{
//     const order = await Order.find().populate({path:'user',model:'User'});
// res.render('orderlist',{order})
//   }catch(error){
//     console.log(error.message)
//   }
// }

async function salesReport(date){
  try{
      const currentDate = new Date();
      let orders = [];
      for (let i = 0; i < date; i++) {
          const startDate = new Date(currentDate);
          startDate.setDate(currentDate.getDate() - i);
          startDate.setHours(0, 0, 0, 0);
          const endDate = new Date(currentDate);
          endDate.setDate(currentDate.getDate() - i);
          endDate.setHours(23, 59, 59, 999);  
      
          const dailyOrders = await Order.find({
            status: "Delivered",
            orderDate: {
              $gte: startDate,
              $lt: endDate,
            },
          });
          
      
          orders = [...orders, ...dailyOrders];
        }
  
        let productEntered = [];
        for (let i = 0; i < date; i++) {
            const startDate = new Date(currentDate);
            startDate.setDate(currentDate.getDate() - i);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(currentDate);
            endDate.setDate(currentDate.getDate() - i);
            endDate.setHours(23, 59, 59, 999);  
        
            const product = await Product.find({
              createdAt: {
                $gte: startDate,
                $lt: endDate,
              },
            });
            
        
            productEntered= [...productEntered, ...product];
          }
        let users = await User.countDocuments();
       
  
        let totalRevenue = 0;
        orders.forEach((order) => {
          totalRevenue += order.billTotal;
        });
      
        let totalOrderCount = await Order.find({
          status: "Delivered",
        });
      
        let Revenue = 0;
        totalOrderCount.forEach((order) => {
          Revenue += order.billTotal;
        });
      
        let stock = await Product.find();
        let totalCountInStock = 0;
        stock.forEach((product) => {
          totalCountInStock += product.countInStock;
        });
      
        let averageSales = orders.length / date; 
        let averageRevenue = totalRevenue / date; 
   
       
        return {
          users,
          totalOrders: orders.length,
          totalRevenue,
          totalOrderCount: totalOrderCount.length,
          totalCountInStock,
          averageSales,
          averageRevenue,
          Revenue,
          productEntered:productEntered.length,
         
          totalOrder:orders
        };
  }
  catch(err){
  console.log('salesreport',err.message);
  }
  }
  
  async function salesReportmw(startDate, endDate) {
      try {
          let orders = await Order.find({
              status: "Delivered",
              orderDate: {
                  $gte: startDate,
                  $lte: endDate,
              },
          });
  
          let productEntered = await Product.find({
              createdAt: {
                  $gte: startDate,
                  $lte: endDate,
              },
          });
  
          let usersCount = await User.countDocuments();
  
          let totalRevenue = orders.reduce((total, order) => total + order.billTotal, 0);
  
          let totalOrderCount = orders.length;
  
          let stock = await Product.find(); 
          let totalCountInStock = stock.reduce((total, product) => total + product.countInStock, 0);
  
          let daysInRange = (endDate - startDate) / (1000 * 60 * 60 * 24);
          let averageSales = totalOrderCount / daysInRange; 
          let averageRevenue = totalRevenue / daysInRange; 
  
          return {
              usersCount,
              totalOrders: totalOrderCount,
              totalRevenue,
              totalCountInStock,
              averageSales,
              averageRevenue,
              productEntered: productEntered.length,
              totalOrder: orders 
          };
      } catch (err) {
          console.error('salesReport error', err.message);
          throw err; 
      }
  }
  
  
  const getWeeksInMonth = (currentDate) => {
      const month = currentDate.getMonth();
      const year = currentDate.getFullYear();
      const weeks = [];
      const firstDate = new Date(year, month, 1);
      const numDays = currentDate.getDate();
  
      let start = 1;
      let end = 7 - currentDate.getDay();
  
      while (start <= numDays) {
          if (end > numDays) {
              end = numDays;
          }
  
          weeks.push({ start: new Date(year, month, start), end: new Date(year, month, end) });
  
          start = end + 1;
  
          // Calculate new end based on the new start
          end = start + 6;
  
          // If end exceeds the number of days in the month, set it to the last day of the month
          if (end > numDays) {
              end = numDays;
          }
      }
  
  
      return weeks;
  };
  
  const getMonthsInYear = (currentMonth) => {
      let months = [];
      for (let month = 0; month <= currentMonth; month++) {
          months.push({ month, year: new Date().getFullYear() });
      }
      return months;
  };
  function getMonthName(month) {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'];
      return monthNames[month];
  }

const pdfreport = async (req, res) => {
  try {
      let title = "";
      const currentDate = new Date();

      switch (req.query.type) {
          case 'daily':
              let dailySalesData = await salesReport(1);
              generatePDF([dailySalesData], "Daily Sales Report", res);
              break;
          case 'weekly':
              let weeklySalesData = [];
              const weeks = getWeeksInMonth(currentDate);
              for (const week of weeks) {
                  const data = await salesReportmw(week.start, week.end);
                  weeklySalesData.push({ ...data, period:`Week ${weeks.indexOf(week) + 1}, ${getMonthName(currentDate.getMonth())}` });
              }
              generatePDF(weeklySalesData, "Weekly Sales Report", res);
              break;
          case 'monthly':
              let monthlySalesData = [];
              const months = getMonthsInYear(currentDate.getMonth());;
              for (const { month, year } of months) {
                  const monthStart = new Date(year, month, 1);
                  const monthEnd = new Date(year, month + 1, 0);
                  const data = await salesReportmw(monthStart, monthEnd);
                  monthlySalesData.push({ ...data, period: `${getMonthName(month)} ${currentDate.getFullYear()}` });
              }
              generatePDF(monthlySalesData, "Monthly Sales Report", res);
              break;
          case 'yearly':
              let yearlySalesData = [await salesReport(365)];
              generatePDF(yearlySalesData, "Yearly Sales Report", res);
              break;
          default:
              res.status(400).send('Invalid report type specified.');
              return;
      }
  } catch (error) {
      console.error('Error generating PDF:', error.message);
      res.status(500).send('Error generating PDF.');
  }
};

const generatePDF = (salesData, title, res) => {
  try {
      let doc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${title.toLowerCase().replace(/\s+/g, "_")}.pdf"`);
      doc.pipe(res);

      const today = new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
      });
      doc.fontSize(20).text(`${title} - ${today}`, { align: 'center' });
      doc.moveDown(2);

      for (const data of salesData) {
          doc.moveDown(2);
          doc.text(data.period, { align: 'left' });

          const tableHeaders = ['Metric', 'Value'];
          const columnStartPositions = [50, 300];
          const fontSize = 12;

          doc.font('Helvetica-Bold').fontSize(fontSize);
          tableHeaders.forEach((header, index) => {
              doc.text(header, columnStartPositions[index], doc.y, { width: 200, align: 'center' });
              doc.strokeColor('black').lineWidth(1);
          });

          doc.font('Helvetica').fontSize(fontSize);
          const tableRows = [
              ['Total Revenue', `INR ${data.totalRevenue}`],
              ['Total Orders', data.totalOrders],
           
              ['Average Sales', `${data.averageSales ? data.averageSales.toFixed(2) : 'N/A'}%`],
              ['Average Revenue', `${data.averageRevenue ? data.averageRevenue.toFixed(2) : 'N/A'}`],
          ];

          data.totalOrder.forEach(order => {
              if (order.coupon !== 'nil') {
                  tableRows.push([`Coupon: ${order.coupon}`, `INR ${order.discountPrice}`]);
              }
          });

          const overallDiscountPrice = data.totalOrder.reduce((total, order) => total + order.discountPrice, 0);
          tableRows.push(['Overall Discount Price', `INR ${overallDiscountPrice}`]);

          tableRows.forEach((row, rowIndex) => {
              row.forEach((text, index) => {
                  doc.text(text, columnStartPositions[index], doc.y, { width: 200, align: 'center' });
              });
              doc.moveDown(0.5);
          });
      }

      doc.end();
  } catch (error) {
      console.error('Error generating PDF:', error.message);
      res.status(500).send('Error generating PDF.');
  }
};

const excel = async (req, res, next) => {
  try {
    const salesDatas = await salesReport(365);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');
    const overallDiscountPrice=salesDatas.totalOrder.reduce((total, order) => total + order.discountPrice, 0);
    const couponcode = salesDatas.totalOrder.map(order => { return order.coupon;});
    const couponCodesString = couponcode.join(', ');
 
    worksheet.columns = [
      { header: 'Total Revenue', key: 'totalRevenue', width: 15 },
      { header: 'Total Orders', key: 'totalOrders', width: 15 },
      { header: 'Total Count In Stock', key: 'totalCountInStock', width: 15 },
      { header: 'Average Sales', key: 'averageSales', width: 15 },
      { header: 'Average Revenue', key: 'averageRevenue', width: 15 },
      { header: 'Revenue', key: 'Revenue', width: 15 },
      { header: 'Applied coupon code', key: 'couponCodesString', width: 15 },
      { header: 'overall discount price', key: 'overalldiscountprice', width: 15 }
    ];
    
  



    worksheet.addRow({
      totalRevenue: salesDatas.totalRevenue,
      totalOrders: salesDatas.totalOrders,
      totalCountInStock: salesDatas.totalCountInStock,
      averageSales: salesDatas.averageSales ? salesDatas.averageSales.toFixed(2) : 'N/A',
      averageRevenue: salesDatas.averageRevenue ? salesDatas.averageRevenue.toFixed(2) : 'N/A',
      Revenue: salesDatas.Revenue,
      couponCodesString:couponCodesString,
      overalldiscountprice:overallDiscountPrice
      
      
    });
    
  


    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="sales_report.xlsx"');

    workbook.xlsx.write(res).then(() => res.end());
  } catch (error) {
    console.log(error.message);
    return res.status(500);
  }
};



const inactivecoupon  = async(req,res)=>{

  try{
    let id = req.query.id;
    let userData = await Coupon.findById({_id:id})
  

    if(userData.isActive==true){
      await Coupon.findByIdAndUpdate({_id:id},{$set:{isActive:false}})
        await userData.save();
        res.redirect('/admin/couponpage')
       }else{
        await Coupon.findByIdAndUpdate({_id:id},{$set:{isActive:true}})
        await userData.save();
        res.redirect('/admin/couponpage')
      } ;
    }
  catch(error){
    console.log(error.message)
  }
 }
  const loadeditcoupon =async (req, res) => {
    try {
      const couponId = req.query.id;
      const coupon = await Coupon.findById(couponId);
  
     
        res.render('editcoupon', { coupon });
     
    } catch (error) {
      console.log(error.message);
      res.status(500).send('An error occurred');
    }
  };

  const editCouponPage = async (req, res) => {
    try {
      const couponId = req.query.id;
      const updatedCouponData = {
        code: req.body.code,
        description: req.body.description,
        minimumAmount: req.body.minimumAmount,
        maximumAmount: req.body.maximumAmount,
        discountPercentage: req.body.discountPercentage,
        expirationDate: req.body.expirationDate,
        maxDiscountAmount: req.body.maxDiscountAmount,
        maxUsers: req.body.maxUsers
      };
  
      const updatedCoupon = await Coupon.findByIdAndUpdate(couponId, updatedCouponData, { new: true });
  
      if (updatedCoupon) {
        return res.redirect('/admin/couponpage');
      } else {
        return res.status(404).send('Coupon not found');
      }
    } catch (error) {
      console.log('update coupon:', error.message);
      res.status(500).send('An error occurred');
    }
  };


 module.exports={
  loginLoad,verifyadminLogin ,adminDashboard,userload,userblock,logouts,adminorderlist,adminorderdetails,acceptcancel,addcoupen,coupenload,couponpage,orderlist,updateOrderStatus,pdfreport,excel,inactivecoupon,loadeditcoupon,editCouponPage}
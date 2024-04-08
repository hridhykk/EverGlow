const mongoose = require('mongoose')

const ObjectID = mongoose.Schema.Types.ObjectId;

const addressSchema = new mongoose.Schema({
   user:{
       type:ObjectID,
       ref:'User',
       required:true
   },
   addresses:[{
      
       HouseNo:{
           type:String,
           required:true
       },
       Street:{
           type:String,
       },
       Landmark:{
           type:String,
       },
       pincode:{
           type:Number,
           required:true
       },
       city:{
           type:String,
           required:true
       },
       district:{
           type:String,
           required:true
       },
       State:{
           type:String,
           required:true
       },
       Country:{
           type:String,
           required:true
       },
       addressType: {
        type: String, 
        required: true,
         enum: ['home', 'work','temp']
       } 

   }],

})




module.exports=mongoose.model("Address",addressSchema);
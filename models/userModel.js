const mongoose=require("mongoose");

const userSchema= new mongoose.Schema({
  name:{
    type:String,
    require:true
  },
  email:{
    type:String,
    require:true

  },
  password:{
    type:String,
    required:true
  },
  
  phone:{
    type:Number,
    required:true
  },

  
  is_admin:{
    type:Number,
    required:true
  },
  is_verified:{
    type:Number,
    default:0
  },

  isBlocked:{
    type:Boolean,
    default:false,
  }

});

module.exports=mongoose.model("User",userSchema);



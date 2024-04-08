const mongoose=require("mongoose");

const categorySchema= new mongoose.Schema({
 
  
  name:{
    type:String,
    require:true,
    unique:true,
    trim:true
    

  },
  description:{
    type:String,
    required:true,
    trim:true
  },
  is_active:{
    type:Boolean,
    default:1

  }
});

module.exports=mongoose.model("Category",categorySchema);
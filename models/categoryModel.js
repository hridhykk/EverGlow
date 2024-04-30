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

  },
  categoryofferApplied:{
    type:Boolean,
    default:false,
  } ,
  categoryofferexp:{
    type:Date,
    
  },
  categorydiscountPercentage:{
    type:Number
  }

});

module.exports=mongoose.model("Category",categorySchema);
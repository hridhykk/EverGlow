const mongoose=require("mongoose");

const adminSchema= new mongoose.Schema({
 
  
  email:{
    type:String,
    require:true

  },
  password:{
    type:String,
    required:true
  }
});

module.exports=mongoose.model("Admin",adminSchema);
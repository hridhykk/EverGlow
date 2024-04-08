const mongoose=require("mongoose");

const productSchema= new mongoose.Schema({
 
  productname: {
    type: String,
    required: true,
 },

 description: {
    type: String,
    required: true
 },


 images:[{
    type:String,
    required:true
}]
 ,

 brand:{
    type:String
 },

 countinstock: {
    type: Number,
    required: true,
    min: 0,
    max: 300
 },

 rating: {
    type: Number,
    default: 0,
 },

 isFeatured: {
    type: Boolean,
    default: true,
 },
 
 category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
 },

 price: {
    type: Number,
    required: true,
    default: 0,

 },
 
 isBlocked:{
   type:Boolean,
   default:false,
 },

 discountPrice:{
    type: Number,
    default: 0,
 },
 afterDiscount:Number,
 },
 {
 strictPopulate:false} ,
 {
 timestamps: true
});




module.exports=mongoose.model("Product",productSchema);
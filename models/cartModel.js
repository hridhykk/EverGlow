const mongoose = require('mongoose');
const ObjectID = mongoose.Schema.Types.ObjectId;

const cartSchema = new mongoose.Schema({
    owner : {
  type: ObjectID,
   required: true,
   ref: 'User'
 },

 items: [{
    productId: {
      type: ObjectID,
      ref: 'products',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min:[1, ],
      default: 1
      },
    price: {
      type:Number
    },
  
    }],
 
billTotal: {
    type: Number,
    required: true,
   default: 0
  },
  couponapplied:{
    type:Boolean,
    default:false
  },
  discountPrice:{
    type: Number,
    default: 0,
 }
}, {
timestamps: true 
})

module.exports=mongoose.model("Cart",cartSchema);

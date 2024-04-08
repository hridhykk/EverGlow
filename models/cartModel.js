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
    image:{
    type: String,
    required:true
    },

    name: {
      type:String,
      required:true,
    },
    productPrice:{
      type:Number,
      required:true
    },
    quantity: {
      type: Number,
      required: true,
      min:[1, 'Quantity can not be less then 1.'],
      default: 1
      },
    price: {
      type:Number
    },
    selected: {
      type: Boolean, 
      default: false, 
  },
    }],
 
billTotal: {
    type: Number,
    required: true,
   default: 0
  }
}, {
timestamps: true 
})

module.exports=mongoose.model("Cart",cartSchema);

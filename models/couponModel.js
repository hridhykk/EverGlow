const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        unique: true,
        required: true,
        uppercase: true
    },
    description: {
        type: String
    },
    minimumAmount: {
        type: Number,
        required: true,
        default: 100
    },
    maximumAmount: {
        type: Number,
        required: true
    },
    discountPercentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    expirationDate: {
        type: Date,
        required: true
    },
    isActive: {
        type: Boolean,
        required: true,
        default: true
    },
   
    usersUsed: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    maxUsers: {
        type: Number,
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Coupon', couponSchema);
// const mongoose = require('mongoose');

// const couponSchema = new mongoose.Schema({
//    code: {
//       type: String,
//       unique: true,
//       required: true,
//       uppercase: true
//    },
//    description: {
//       type: String,

//    },
//    minimumAmount: {
//       type: Number,
//       required: true,
//       default: 100
//    },
//    maximumAmount: {
//       type: Number,
//       required: true,
//    },
//    discountPercentage: {
//       type: Number,
//       required: true,
//       min: 0, // Minimum value for percentage (0%)
//       max: 100, // Maximum value for percentage (100%)
//       // Convert from decimal to percentage when retrieving data
//       // set: (v) => (v / 100),  // Convert from percentage to decimal when saving data
//    },
//    expirationDate: {
//       type: Date,
//       required: true,
//    },
//    isActive: {
//       type: Boolean,
//       required: true,
//       default: true,
//    },
//    maxDiscountAmount: {
//       type: Number,
//       default: null, 
//    },
//    usersUsed: [{
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'User',
//    }, ],
//    maxUsers: {
//       type: Number,
//       default: null, 
//    },

  
// }, {
//    timestamps: true
// });

// module.exports = mongoose.model('coupon', couponSchema);
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectID = mongoose.Schema.Types.ObjectId;
const transactionSchema = new Schema({
  amount: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ['credit', 'debit'],
    required: true,
  },

}, {
  timestamps: true,
});

const walletSchema = new Schema({
  user: {
    type:ObjectID,
    ref: 'User',
    required: true,
   
  },
  balance: {
    type: Number,
    default: 0,
    min: 0,
  },
  transactions: [transactionSchema],

  pendingOrder: {
    orderId: {
      type: String,
    },
    amount: {
      type: Number,
      min: 0,
    },
    currency: {
      type: String,
    },
  },
}, {
  timestamps: true,
});

const WalletModel = mongoose.model('Wallet', walletSchema);
module.exports = WalletModel

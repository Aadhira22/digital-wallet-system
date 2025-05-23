const mongoose = require('mongoose');
const transactionSchema = new mongoose.Schema({
  type: { type: String, enum: ['deposit', 'withdraw', 'transfer'], required: true },
  amount: { type: Number, required: true },
  currency: { type: String, enum: ['USD', 'INR'], required: true },
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: { type: Date, default: Date.now },
  isDeleted: {
    type: Boolean,
    default: false
  }
});
module.exports = mongoose.model('Transaction', transactionSchema);

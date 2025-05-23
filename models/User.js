// models/User.js
const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  wallet: {
    balances: {
      USD: { type: Number, default: 0 },
      INR: { type: Number, default: 0 }
    },
    transactions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }]
  },
  flags: [
    {
      type: { type: String },
      reason: String,
      currency: String,
      amount: Number,
      date: Date
    }
  ],
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: { type: Date, default: null },
    
}, { timestamps: true });
module.exports = mongoose.model('User', userSchema);

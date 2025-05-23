const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// Validate amount and currency
function validateInput(amount, currency, res) {
  if (!['USD', 'INR'].includes(currency)) {
    res.status(400).json({ message: 'Unsupported currency' }); // Invalid currency
    return false;
  }
  if (typeof amount !== 'number' || amount <= 0) {
    res.status(400).json({ message: 'Amount must be a positive number' }); // Invalid amount
    return false;
  }
  return true;
}

// Deposit money
exports.deposit = async (req, res) => {
  const { amount, currency } = req.body;
  const userId = req.user.userId;

  if (!validateInput(amount, currency, res)) return;

  try {
    const user = await User.findById(userId); // Get user
    if (!user || user.isDeleted) {
      return res.status(403).json({ message: 'Account is deleted. Action not allowed.' });
    }

    user.wallet.balances[currency] += amount; // Add balance

    const tx = await Transaction.create({
      type: 'deposit',
      amount,
      currency,
      to: userId
    });

    user.wallet.transactions.push(tx._id); // Log transaction
    await user.save();

    res.status(200).json({ message: 'Deposit successful', balance: user.wallet.balances });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Withdraw money
exports.withdraw = async (req, res) => {
  const { amount, currency } = req.body;
  const userId = req.user.userId;

  if (!validateInput(amount, currency, res)) return;

  try {
    const user = await User.findById(userId); // Get user
    if (!user || user.isDeleted) {
      return res.status(403).json({ message: 'Account is deleted. Action not allowed.' });
    }

    const WITHDRAW_THRESHOLD = { USD: 250, INR: 25000 };

    if (user.wallet.balances[currency] < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Flag large withdrawals
    if (amount > WITHDRAW_THRESHOLD[currency]) {
      console.log(`[ALERT] User ${userId} - large withdrawal of ${amount} ${currency}`);
      user.flags = user.flags || [];
      user.flags.push({
        type: 'suspicious_activity',
        reason: 'Large withdrawal threshold exceeded',
        currency,
        amount,
        date: new Date()
      });
      await user.save();
      return res.status(400).json({ message: 'Large withdrawal flagged' });
    }

    user.wallet.balances[currency] -= amount; // Deduct balance

    const tx = await Transaction.create({
      type: 'withdraw',
      amount,
      currency,
      from: userId
    });

    user.wallet.transactions.push(tx._id); // Log transaction
    await user.save();

    res.status(200).json({ message: 'Withdraw successful', balance: user.wallet.balances });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Transfer money between users
exports.transfer = async (req, res) => {
  const { amount, currency, recipientEmail } = req.body;
  const senderId = req.user.userId;
  const session = await mongoose.startSession();

  const TRANSFER_THRESHOLD = { USD: 250, INR: 25000 };
  const ONE_MINUTE = 60 * 1000;

  if (!['USD', 'INR'].includes(currency) || amount <= 0) {
    return res.status(400).json({ message: 'Invalid currency or amount' });
  }

  try {
    session.startTransaction();

    const sender = await User.findById(senderId).session(session); // Sender
    const recipient = await User.findOne({ email: recipientEmail }).session(session); // Recipient

    if (!sender || sender.isDeleted) {
      await session.abortTransaction();
      return res.status(403).json({ message: 'Sender account is deleted. Transfer not allowed.' });
    }

    if (!recipient || recipient.isDeleted) {
      await session.abortTransaction();
      return res.status(403).json({ message: 'Recipient account is deleted. Transfer not allowed.' });
    }

    if (sender.wallet.balances[currency] < amount) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Flag large transfers
    if (amount > TRANSFER_THRESHOLD[currency]) {
      console.log(`[FRAUD ALERT] User ${senderId} - Large transfer of ${amount} ${currency}`);
      sender.flags = sender.flags || [];
      sender.flags.push({
        type: 'suspicious_activity',
        reason: 'Large transfer threshold exceeded',
        currency,
        amount,
        date: new Date()
      });
      await sender.save();
      await session.abortTransaction();
      return res.status(400).json({ message: 'Large transfer flagged and blocked' });
    }

    // Flag frequent transfers
    const oneMinuteAgo = new Date(Date.now() - ONE_MINUTE);
    const recentTransfers = await Transaction.find({
      type: 'transfer',
      from: senderId,
      date: { $gte: oneMinuteAgo }
    }).session(session);

    if (recentTransfers.length >= 3) {
      console.log(`[FRAUD ALERT] User ${senderId} - ${recentTransfers.length} transfers in the past 1 minute`);
    }

    // Perform transfer
    sender.wallet.balances[currency] -= amount;
    recipient.wallet.balances[currency] += amount;

    const tx = await Transaction.create([{
      type: 'transfer',
      amount,
      currency,
      from: sender._id,
      to: recipient._id
    }], { session });

    sender.wallet.transactions.push(tx[0]._id);
    recipient.wallet.transactions.push(tx[0]._id);

    await sender.save({ session });
    await recipient.save({ session });

    await session.commitTransaction();
    res.status(200).json({ message: 'Transfer successful' });
  } catch (err) {
    await session.abortTransaction(); // Rollback on error
    res.status(500).json({ message: err.message });
  } finally {
    session.endSession(); // End session
  }
};

// Get user transactions
exports.getTransactions = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId); // Get user
    if (!user || user.isDeleted) {
      return res.status(403).json({ message: 'Account is deleted.' });
    }

    await user.populate({
      path: 'wallet.transactions',
      match: { isDeleted: false },
      options: { sort: { date: -1 } },
      populate: [{ path: 'from', select: 'email' }, { path: 'to', select: 'email' }]
    });

    res.status(200).json({ transactions: user.wallet.transactions }); // Return txs
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get full transaction history
exports.getTransactionHistory = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || user.isDeleted) {
      return res.status(403).json({ message: 'Account is deleted.' });
    }

    await user.populate({
      path: 'wallet.transactions',
      match: { isDeleted: false },
      options: { sort: { date: -1 } },
      populate: [
        { path: 'from', select: 'email' },
        { path: 'to', select: 'email' }
      ]
    });

    res.status(200).json({
      message: 'Transaction history fetched successfully',
      transactions: user.wallet.transactions
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get wallet balances
exports.getBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId); // Get user
    if (!user || user.isDeleted) {
      return res.status(403).json({ message: 'Account is deleted.' });
    }

    res.status(200).json({ balances: user.wallet.balances }); // Return balance
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Soft delete a transaction
exports.deleteTransaction = async (req, res) => {
  try {
    const tx = await Transaction.findOne({ _id: req.params.id, isDeleted: false }); // Find tx

    if (!tx) return res.status(404).json({ message: 'Transaction not found' });

    tx.isDeleted = true;
    await tx.save(); // Mark as deleted

    res.status(200).json({ message: 'Transaction soft-deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

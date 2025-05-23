const User = require('../models/User');

// Get users who have been flagged
exports.getFlaggedUsers = async (req, res) => {
  try {
    const flaggedUsers = await User.find({
      isDeleted: false,                     // Skip deleted users
      flags: { $exists: true, $not: { $size: 0 } } // Must have non-empty flags
    }).select('email flags');              // Return only email and flags

    res.status(200).json({ flaggedUsers });
  } catch (err) {
    res.status(500).json({ message: err.message }); // Handle errors
  }
};

// Get total balances across all users
exports.getTotalBalances = async (req, res) => {
  try {
    const users = await User.find({ isDeleted: false }); // All active users
    let totalUSD = 0, totalINR = 0;

    users.forEach(user => {
      totalUSD += user.wallet.balances.USD || 0; // Add USD
      totalINR += user.wallet.balances.INR || 0; // Add INR
    });

    res.status(200).json({ totalUSD, totalINR });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get top 5 users by total balance in USD (INR converted)
exports.getTopUsersByBalance = async (req, res) => {
  try {
    const users = await User.find({ isDeleted: false }).select('email wallet.balances');

    const usersWithTotal = users.map(user => {
      const usd = user.wallet.balances.USD || 0;
      const inr = user.wallet.balances.INR || 0;
      const totalInUSD = usd + (inr / 85); // Convert INR to USD
      return { email: user.email, totalInUSD };
    });

    usersWithTotal.sort((a, b) => b.totalInUSD - a.totalInUSD); // Sort by balance

    res.status(200).json({ topUsers: usersWithTotal.slice(0, 5) }); // Top 5
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get top 5 users by number of transactions
exports.getTopUsersByTransactionVolume = async (req, res) => {
  try {
    const users = await User.find({ isDeleted: false }).select('email wallet.transactions');

    const volumeList = users.map(user => ({
      email: user.email,
      transactionCount: user.wallet.transactions.length // Count txs
    }));

    volumeList.sort((a, b) => b.transactionCount - a.transactionCount); // Sort by count

    res.status(200).json({ topUsers: volumeList.slice(0, 5) }); // Top 5
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

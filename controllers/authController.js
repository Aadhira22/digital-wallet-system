const User = require('../models/User');
const Transaction = require('../models/Transaction');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Register a new user
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email }); // Check if user exists
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10); // Hash pwd
    const user = await User.create({ name, email, password: hashedPassword }); // Save user

    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message }); // Error catch
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Hardcoded admin login
    if (email === 'default@example.com' && password === '43521') {
      const token = jwt.sign(
        { userId: 'hardcodedId', email },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      return res.status(200).json({ token });
    }

    const user = await User.findOne({ email }); // Find user
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    // Soft-deleted account check
    if (user.isDeleted) {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days
      if (user.deletedAt && user.deletedAt <= ninetyDaysAgo) {
        await Transaction.deleteMany({
          type: { $in: ['withdraw', 'deposit'] },
          $or: [{ from: user._id }, { to: user._id }]
        }); // Delete txs
        await user.deleteOne(); // Hard delete
        return res.status(410).json({ message: 'Account permanently deleted after 90 days' });
      }
      return res.status(403).json({ message: 'Account is deleted. Contact support to restore.' });
    }

    const isMatch = await bcrypt.compare(password, user.password); // Compare pwd
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    ); // Generate token

    res.status(200).json({ token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Soft delete account
exports.deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId); // Get user
    if (!user || user.isDeleted) {
      return res.status(404).json({ message: 'User not found or already deleted' });
    }

    user.isDeleted = true;
    user.deletedAt = new Date(); // Mark as deleted
    await user.save();

    res.status(200).json({ message: 'Account deleted (soft delete)' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

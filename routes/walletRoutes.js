const express = require('express');
const auth = require('../middlewares/authMiddleware');
const {
  deposit,
  withdraw,
  transfer,
  getTransactions,
  getBalance,
  getTransactionHistory,
  deleteTransaction
} = require('../controllers/walletController');

const router = express.Router();

router.post('/deposit', auth, deposit);
router.post('/withdraw', auth, withdraw);
router.post('/transfer', auth, transfer);
router.get('/balance', auth, getBalance);
router.get('/transactions', auth,getTransactionHistory);
router.delete('/transaction/:id', auth, deleteTransaction);

module.exports = router;

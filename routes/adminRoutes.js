const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const {getFlaggedUsers,getTotalBalances,getTopUsersByBalance,getTopUsersByTransactionVolume} = require('../controllers/adminController');

router.get('/flagged-users',auth,adminMiddleware, getFlaggedUsers);
router.get('/total-balances', auth,adminMiddleware,getTotalBalances);
router.get('/top-users/balance', auth,adminMiddleware,getTopUsersByBalance);
router.get('/top-users/volume', auth,adminMiddleware,getTopUsersByTransactionVolume);

module.exports = router;

// routes/authRoutes.js
const express = require('express');
const { register, login ,deleteAccount } = require('../controllers/authController');
const auth = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.delete('/account', auth,deleteAccount);
module.exports = router;

const express = require('express');
const router = express.Router();

const { getAllUsers, getUserProfile, updateUser, deleteUser } = require('../controllers/userController');
const { protect, admin, adminOrManager } = require('../middleware/authMiddleware');

router.get('/', protect, adminOrManager, getAllUsers);
router.get('/profile/:id', protect, getUserProfile);
router.put('/update/:id', protect, updateUser);
router.delete('/delete/:id', protect, admin, deleteUser);


module.exports = router;
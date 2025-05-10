const asyncHandler = require('express-async-handler');
const User = require("../models/User");
const bcrypt = require('bcryptjs');
const validator = require('validator');

const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find().select('-password'); // Exclude passwords

    if (!users || users.length === 0) {
        return res.status(404).json({ message: 'No users found' });
    }

    res.status(200).json(users);
});



const updateUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, email, password, role } = req.body;
    
    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    
    // Validate email if provided
    if (email && !validator.isEmail(email)) {
        return res.status(400).json({ message: "Invalid email!" });
    }
    
    // Check if email already exists for another user
    if (email && email !== user.email) {
        const emailExists = await User.findOne({ email }).lean();
        if (emailExists) {
            return res.status(400).json({ message: 'Email already in use' });
        }
    }
    
    // Update user fields if provided
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;

    if (password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
    }
    
    // Save updated user
    const updatedUser = await user.save();
    
    res.status(200).json({
        message: 'User updated successfully',
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
    });
});

// Delete User
const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    
    // Delete user
    await User.findByIdAndDelete(id);
    
    res.status(200).json({ message: 'User deleted successfully' });
});


// Get User Profile
const getUserProfile = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const user = await User.findById(id).select('-password');
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(user);
});


module.exports = {
    getAllUsers,
    updateUser,
    deleteUser,
    getUserProfile,
};

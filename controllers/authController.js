const asyncHandler = require('express-async-handler');
const validator = require('validator');
const User = require('../models/User');
const Token = require('../models/Token');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const registerUser = asyncHandler(async (req, res) => {
    // Get input data from req.body to check if email exist
    const { name, email, password, role } = req.body;

    // console.log({name, email, password, role});
    

    if (!validator.isEmail(email)) {
        return res.status(400).json({ message: "Invalid email!" })
    }

    if (!password || password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Finding user in database with their email
    const userExist = await User.findOne({ email }).lean();  // Use lean for read-only;
    if (userExist) {
        console.error({message: 'User already exists'});
        return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);


    // New user info
    const newUser = new User({
        name,
        email,
        password: hashedPassword,
        role,
    });

    // Save new user to the database
    const savedUser = await newUser.save();
    

    res.status(201).json({ 
        message: 'User register successfully',
        _id: savedUser?._id,
        email: savedUser?.email,
    });
});


const loginUser = asyncHandler(async(req, res) => {
    // Get input data from req.body
    const { email, password } = req.body;
    // console.log("Email:", email, "Password:", password);
    

    // Validate fields
    if (!email || !password || password.length < 6 || !validator.isEmail(email)) {
        return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Find user in database
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "Invalid credentials" });

    // Check if password is matching
    // Use bcrypt to compare the password with the hashed password in the database
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // Update last active
    user.lastActive = new Date();
    await user.save();

    // Generate JWT
    const token = jwt.sign(
        { id: user._id, role: user.role }, 
        process.env.JWT_SECRET, 
        { expiresIn: '1d' }
    );

    res.status(200).json({
      message: "Login successful",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token: token
    });
})


// Logout User
const logoutUser = asyncHandler(async (req, res) => {
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(400).json({ message: 'No token provided' });
    }
    
    try {
        // Verify the token to get user info
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Add token to blacklist
        await Token.create({
            token,
            userId: decoded.id,
            expiresAt: new Date(decoded.exp * 1000),
            isManualLogout: true,
            reason: 'User initiated logout'
        });
        
        // Update last active timestamp
        const user = await User.findById(decoded.id);
        if (user) {
            user.lastActive = new Date();
            await user.save();
        }
        
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' });
        }
        res.status(401).json({ message: 'Invalid token' });
    }
});

module.exports = {
    registerUser,
    loginUser,
    logoutUser
};


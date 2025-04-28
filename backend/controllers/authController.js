const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  return jwt.sign(
    { 
      id: user._id,
      email: user.email,
      userType: user.userType 
    }, 
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

exports.register = async (req, res) => {
  try {
    console.log('Register request received:', {
      ...req.body,
      password: '***' // Don't log the actual password
    });

    const { name, email, password, userType, bloodType, phoneNumber, location } = req.body;

    // Validate required fields
    if (!name || !email || !password || !userType || !phoneNumber) {
      console.log('Missing required fields');
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate blood type for common users
    if (userType === 'commonUser' && !bloodType) {
      console.log('Blood type required for common users');
      return res.status(400).json({ message: 'Blood type is required for common users' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(409).json({ message: 'User already exists' });
    }

    // Hash the password before saving
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Prepare user data
    const userData = {
      name,
      email,
      password: hashedPassword,
      userType,
      bloodType: userType === 'commonUser' ? bloodType : undefined,
      phoneNumber
    };

    // Add location if provided
    if (location && location.latitude && location.longitude) {
      userData.location = {
        type: 'Point',
        coordinates: [location.longitude, location.latitude]
      };
    }

    console.log('Creating new user:', {
      ...userData,
      password: '***'
    });

    const user = new User(userData);
    await user.save();

    // Generate token
    const token = generateToken(user);

    console.log('User created successfully:', user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        bloodType: user.bloodType
      }
    });
  } catch (error) {
    console.error('Registration error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    // Handle specific MongoDB errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    if (error.name === 'MongoError' && error.code === 11000) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    res.status(500).json({ 
      message: 'Error creating user',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.log('User not found');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      console.log('Password incorrect');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user);

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        bloodType: user.bloodType
      }
    });

  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Server error during login' });
  }
};

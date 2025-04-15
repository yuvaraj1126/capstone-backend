const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const router = express.Router();


router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const user = new User({username: name, email, password });

    await user.save();

    // Generate a JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // optional: token expires in 7 days
    );

    // Send token and user info
    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json('User not found');

    const isValid = await user.comparePassword(password); // Use the method in the schema
    if (!isValid) return res.status(401).json('Invalid credentials');

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // optional: token expires in 7 days
    );

    res.json({
      token,
      user: { id: user._id, name: user.username, email: user.email}
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

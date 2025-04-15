const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json('Access denied');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { _id: decoded._id }; // ✅ define the whole user object
    next();
  } catch (err) {
    console.error('JWT verification error:', err);
    res.status(401).json('Invalid token');
  }
};

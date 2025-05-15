// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(403).json({ message: 'Token diperlukan' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;  // Menyimpan data user di request object
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token tidak valid' });
  }
};

export default authMiddleware;

const jwt = require('jsonwebtoken');
const pool = require('../config/database');
require('dotenv').config();

const adminMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Token não fornecido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [rows] = await pool.query('SELECT role FROM users WHERE id = ?', [decoded.id]);
    const user = rows[0];
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Acesso restrito a administradores' });
    }
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido' });
  }
};

module.exports = adminMiddleware;
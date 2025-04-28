const pool = require('../config/database');

exports.getBarbers = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM barbers');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao listar barbeiros' });
  }
};
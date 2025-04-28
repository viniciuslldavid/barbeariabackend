const pool = require('../config/database');

exports.getServices = async (req, res) => {
  try {
    const [services] = await pool.query('SELECT * FROM services');
    // Converter o campo price para número
    const formattedServices = services.map(service => ({
      ...service,
      price: parseFloat(service.price),
    }));
    res.json(formattedServices);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao obter serviços' });
  }
};
const express = require('express');
const cors = require('cors');
const app = express();

// Configurar CORS para permitir requisições de http://localhost:3000
app.use(cors({
  origin: 'https://barbeariafrontend.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Rotas
app.use('/api', require('./routes/api')); // Rotas de autenticação e outras
app.use('/api', require('./routes/scheduleRoutes')); // Rotas de agendamentos

const PORT = process.env.PORT || 3306;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
const pool = require('../config/database');

exports.createSchedule = async (req, res) => {
  const { serviceId, barberId, date, time } = req.body;
  const userId = req.user.id;

  try {
    const [existingSchedules] = await pool.query(
      'SELECT * FROM schedules WHERE barber_id = ? AND schedule_date = ? AND schedule_time = ? AND status != "rejected"',
      [barberId, date, time]
    );
    if (existingSchedules.length > 0) {
      return res.status(400).json({ message: 'Horário já reservado' });
    }

    await pool.query(
      'INSERT INTO schedules (user_id, service_id, barber_id, schedule_date, schedule_time, status) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, serviceId, barberId, date, time, 'pending']
    );
    res.status(201).json({ message: 'Agendamento criado com sucesso, aguardando aprovação' });
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    res.status(500).json({ message: 'Erro ao criar agendamento' });
  }
};

exports.createPublicSchedule = async (req, res) => {
  const { serviceId, barberId, date, time, userName, userPhone } = req.body;

  if (!userName || !userPhone) {
    return res.status(400).json({ message: 'Nome e telefone são obrigatórios para agendamentos sem login' });
  }

  try {
    const [existingSchedules] = await pool.query(
      'SELECT * FROM schedules WHERE barber_id = ? AND schedule_date = ? AND schedule_time = ? AND status != "rejected"',
      [barberId, date, time]
    );
    if (existingSchedules.length > 0) {
      return res.status(400).json({ message: 'Horário já reservado' });
    }

    await pool.query(
      'INSERT INTO schedules (user_id, service_id, barber_id, schedule_date, schedule_time, user_name, user_phone, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [null, serviceId, barberId, date, time, userName, userPhone, 'pending']
    );
    res.status(201).json({ message: 'Agendamento criado com sucesso, aguardando aprovação' });
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    res.status(500).json({ message: 'Erro ao criar agendamento' });
  }
};

exports.getUserSchedules = async (req, res) => {
  const userId = req.user.id;
  try {
    const [schedules] = await pool.query(
      `SELECT s.id, 
              DATE_FORMAT(s.schedule_date, '%d/%m/%Y') as schedule_date, 
              TIME_FORMAT(s.schedule_time, '%H:%i') as schedule_time, 
              s.status, 
              sv.name as service_name, 
              b.name as barber_name
       FROM schedules s
       JOIN services sv ON s.service_id = sv.id
       JOIN barbers b ON s.barber_id = b.id
       WHERE s.user_id = ? AND s.schedule_date >= CURDATE()`,
      [userId]
    );

    // Validação adicional para datas e horários
    const validatedSchedules = schedules.map(schedule => ({
      ...schedule,
      schedule_date: schedule.schedule_date && schedule.schedule_date !== '00/00/0000' ? schedule.schedule_date : 'Data Inválida',
      schedule_time: schedule.schedule_time && schedule.schedule_time !== '00:00' ? schedule.schedule_time : 'Horário Inválido',
    }));

    res.json(validatedSchedules);
  } catch (error) {
    console.error('Erro ao obter agendamentos:', error);
    res.status(500).json({ message: 'Erro ao obter agendamentos' });
  }
};

exports.getAllSchedules = async (req, res) => {
  try {
    const [schedules] = await pool.query(
      `SELECT s.id, 
              COALESCE(s.user_name, u.name) as user_name, 
              COALESCE(s.user_phone, u.phone) as user_phone, 
              sv.name as service_name, 
              b.name as barber_name, 
              DATE_FORMAT(s.schedule_date, '%d/%m/%Y') as schedule_date, 
              TIME_FORMAT(s.schedule_time, '%H:%i') as schedule_time, 
              s.status
       FROM schedules s
       LEFT JOIN users u ON s.user_id = u.id
       JOIN services sv ON s.service_id = sv.id
       JOIN barbers b ON s.barber_id = b.id
       WHERE s.schedule_date IS NOT NULL AND s.schedule_time IS NOT NULL`
    );

    // Validação adicional para datas e horários
    const validatedSchedules = schedules.map(schedule => ({
      ...schedule,
      schedule_date: schedule.schedule_date && schedule.schedule_date !== '00/00/0000' ? schedule.schedule_date : 'Data Inválida',
      schedule_time: schedule.schedule_time && schedule.schedule_time !== '00:00' ? schedule.schedule_time : 'Horário Inválido',
    }));

    res.json(validatedSchedules);
  } catch (error) {
    console.error('Erro ao obter agendamentos:', error);
    res.status(500).json({ message: 'Erro ao obter agendamentos' });
  }
};

exports.getAvailableTimes = async (req, res) => {
  const { date, barberId } = req.query;

  if (!date || !barberId) {
    return res.status(400).json({ message: 'Data e barbeiro são obrigatórios' });
  }

  try {
    const [existingSchedules] = await pool.query(
      'SELECT schedule_time FROM schedules WHERE schedule_date = ? AND barber_id = ? AND status != "rejected"',
      [date, barberId]
    );

    const allTimes = [];
    for (let hour = 9; hour <= 18; hour++) {
      const time = `${hour.toString().padStart(2, '0')}:00:00`;
      allTimes.push(time);
    }

    const bookedTimes = existingSchedules.map(schedule => schedule.schedule_time);
    const availableTimes = allTimes.filter(time => !bookedTimes.includes(time));

    res.json(availableTimes);
  } catch (error) {
    console.error('Erro ao obter horários disponíveis:', error);
    res.status(500).json({ message: 'Erro ao obter horários disponíveis' });
  }
};

exports.updateScheduleStatus = async (req, res) => {
  const { scheduleId, status } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Status inválido' });
  }

  try {
    const [result] = await pool.query(
      'UPDATE schedules SET status = ? WHERE id = ?',
      [status, scheduleId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Agendamento não encontrado' });
    }
    res.json({ message: `Agendamento ${status === 'approved' ? 'aprovado' : 'rejeitado'} com sucesso` });
  } catch (error) {
    console.error('Erro ao atualizar status do agendamento:', error);
    res.status(500).json({ message: 'Erro ao atualizar status do agendamento' });
  }
};

exports.createBarber = async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Nome do barbeiro é obrigatório' });
  }

  try {
    await pool.query('INSERT INTO barbers (name) VALUES (?)', [name]);
    res.status(201).json({ message: 'Barbeiro cadastrado com sucesso' });
  } catch (error) {
    console.error('Erro ao cadastrar barbeiro:', error);
    res.status(500).json({ message: 'Erro ao cadastrar barbeiro' });
  }
};

exports.createService = async (req, res) => {
  const { name, price } = req.body;

  if (!name || !price) {
    return res.status(400).json({ message: 'Nome e preço do serviço são obrigatórios' });
  }

  try {
    await pool.query('INSERT INTO services (name, price) VALUES (?, ?)', [name, price]);
    res.status(201).json({ message: 'Serviço cadastrado com sucesso' });
  } catch (error) {
    console.error('Erro ao cadastrar serviço:', error);
    res.status(500).json({ message: 'Erro ao cadastrar serviço' });
  }
};
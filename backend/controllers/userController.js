const bcrypt = require('bcrypt');
const validator = require('validator');
const userModel = require('../models/userModel');

const registerUser = async (req, res) => {
  const { name, email, password, role = 'technician' } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format.' });
  }

  try {
    // Cek apakah email sudah ada
    userModel.findUserByEmail(email, async (err, user) => {
      if (err) return res.status(500).json({ error: 'Database error.' });
      if (user) return res.status(409).json({ error: 'Email already registered.' });

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      userModel.createUser(name, email, hashedPassword, role, (err, result) => {
        if (err) return res.status(500).json({ error: 'Failed to register user.' });
        res.status(201).json({ message: 'User registered successfully.' });
      });
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

const loginUser = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: 'Email dan password wajib diisi.' });

  userModel.findUserByEmail(email, async (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error.' });
    if (!user) return res.status(401).json({ error: 'Email tidak terdaftar.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Password salah.' });

    // Hilangkan password sebelum dikirim ke client
    delete user.password;
    res.status(200).json({ message: 'Login berhasil', user });
  });
};

const db = require('../config/db');

const forgotPassword = (req, res) => {
  const { email } = req.body;

  db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
    if (err) return res.status(500).json({ error: 'Terjadi kesalahan server' });

    if (results.length === 0) {
      return res.status(404).json({ message: 'Email tidak ditemukan' });
    }

    // Simulasi kirim link reset password
    // Di real case, kamu akan kirim email berisi token link
    return res.json({
      message: 'Link reset password telah dikirim ke email anda (simulasi).',
    });
  });
};

module.exports = {
  registerUser,
  loginUser,
  forgotPassword
};
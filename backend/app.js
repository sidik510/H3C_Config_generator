const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const configRoutes = require('./routes/configRoutes');
const userRoutes = require('./routes/userRoutes');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// API route
app.use('/api', configRoutes);
app.use('/api/users', userRoutes);
app.use('/api/configs', configRoutes);
app.listen(3000, () => {
  console.log('Server berjalan di http://localhost:3000');
});

// Server start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

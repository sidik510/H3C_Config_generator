import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoute from './routes/userRoute.js';
import dashboardRoute from './routes/dashboardRoute.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// API route
app.use('/api/users', userRoute);
app.use('/api/configs', dashboardRoute);

// Server start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

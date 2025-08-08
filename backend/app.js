import express from 'express';
import connectDB from './config/db.js';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import authRoutes from './Routes/authRoutes.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cookieParser())

// Connect to MongoDB Atlas
connectDB();
app.use('/api/auth',authRoutes)

app.get('/', (req, res) => {
  res.send('MongoDB connection check successful!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

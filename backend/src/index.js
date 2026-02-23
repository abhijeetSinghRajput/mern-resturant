import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './db.js';
import cookieParser from 'cookie-parser';
import { ENV } from './config/env.js';

import authRoutes from './routes/auth.routes.js';
import imageRoutes from './routes/image.routes.js';
import categoryRoutes from './routes/category.routes.js';
import foodItemRoutes from './routes/foodItem.routes.js';
import adminUserRoutes from './routes/adminUser.routes.js';

dotenv.config();

const app = express();
const PORT = ENV.PORT;
const allowedOrigins = ENV.CLIENT_URLS
  ? ENV.CLIENT_URLS.split(',').map((origin) => origin.trim())
  : ['http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/food-items', foodItemRoutes);
app.use('/api/admin/users', adminUserRoutes);

app.get('/', (req, res) => {
  res.status(200).json({ message: "Hello from server" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB();
});

import mongoose from 'mongoose';
import ora from 'ora';
import { ENV } from './config/env.js';

const connectDB = async () => {
  const spinner = ora('Connecting to MongoDB...').start();
  try {
    await mongoose.connect(ENV.DB_URI);
    spinner.succeed('MongoDB connected');
  } catch (error) {
    spinner.fail('MongoDB connection failed');
    console.error(error);
    process.exit(1);
  }
};

export default connectDB;

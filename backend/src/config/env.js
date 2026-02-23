import dotenv from "dotenv";

dotenv.config();

const requireEnv = (key) => {
    if (!process.env[key]) {
        throw new Error(`Environment variable ${key} is required`);
    }

    return process.env[key];
};

export const ENV = {
    PORT: requireEnv("PORT"),
    NODE_ENV: requireEnv("NODE_ENV"),
    JWT_SECRET: requireEnv("JWT_SECRET"),
    DB_URI: requireEnv("DB_URI"),

    CLOUDINARY_CLOUD_NAME: requireEnv("CLOUDINARY_CLOUD_NAME"),
    CLOUDINARY_API_KEY: requireEnv("CLOUDINARY_API_KEY"),
    CLOUDINARY_API_SECRET: requireEnv("CLOUDINARY_API_SECRET"),
    CLOUDINARY_UPLOAD_PRESET: requireEnv("CLOUDINARY_UPLOAD_PRESET"),
    CLOUDINARY_URL: requireEnv("CLOUDINARY_URL"),

    BREVO_API_KEY: process.env.BREVO_API_KEY,
    EMAIL_SENDER: process.env.EMAIL_SENDER,
    GOOGLE_CLIENT_ID: requireEnv("GOOGLE_CLIENT_ID"),
    GOOGLE_SECRET_ID: requireEnv("GOOGLE_SECRET_ID"),
    GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
    CLIENT_URL: process.env.CLIENT_URL,
    CLIENT_URLS: requireEnv("CLIENT_URLS"),

    RAZORPAY_KEY_ID: requireEnv("RAZORPAY_KEY_ID"),
    RAZORPAY_KEY_SECRET: requireEnv("RAZORPAY_KEY_SECRET"),
};
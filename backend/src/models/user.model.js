import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    isEmailVerified: {
        type: Boolean,
        default: false,
    },

    password: {
      type: String,
      minlength: 8,
      select: false, // don't return password by default
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    phone: {
      type: String,
    },

    googleId: {
      type: String,
    },

    subscriptionId: {
      type: String,
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },

    avatar: {
      public_id: String,
      url: String,
    },
  },
  { timestamps: true }
);


// 🔐 Password Hashing Before Save
userSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});


// 🔎 Compare Password Method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
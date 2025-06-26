// otp-auth.js
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const router = express.Router();

// Logging utility
const log = (message, data = "") => {
  console.log(`[OTP-AUTH] ${new Date().toISOString()} - ${message}`, data);
};

// User schema
const userSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    validate: {
      validator: (v) => /^[6-9]\d{9}$/.test(v),
      message: "Phone number must be a valid Indian mobile number",
    },
  },
  name: { type: String, trim: true, maxlength: 100 },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: (v) => !v || /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v),
      message: "Please enter a valid email address",
    },
  },
  isVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastLogin: { type: Date },
});

userSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

userSchema.index({ phone: 1 }, { unique: true });
const User = mongoose.model("CleanCareUser", userSchema);

// OTP Management
class OTPManager {
  constructor() {
    this.otpStore = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }
  cleanup() {
    const now = new Date();
    for (const [phone, data] of this.otpStore.entries()) {
      if (now > data.expiry) this.otpStore.delete(phone);
    }
  }
  store(phone, otp, minutes = 5) {
    const expiry = new Date(Date.now() + minutes * 60 * 1000);
    this.otpStore.set(phone, { otp, expiry, attempts: 0 });
  }
  get(phone) { return this.otpStore.get(phone); }
  delete(phone) { return this.otpStore.delete(phone); }
  incrementAttempts(phone) {
    if (this.otpStore.has(phone)) this.otpStore.get(phone).attempts++;
  }
}
const otpManager = new OTPManager();

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
const cleanPhone = (p) => p?.replace(/\D/g, "");
const isValidPhone = (p) => /^(91)?[6-9]\d{9}$/.test(cleanPhone(p));

const sendSMS = async (phone, otp) => {
  const apiKey = process.env.DVHOSTING_API_KEY;
  if (!apiKey) return { success: true, message: "Simulation mode" };

  const url = `https://dvhosting.in/api-sms-v4.php?authorization=${apiKey}&route=otp&variables_values=${otp}&numbers=${phone}`;
  const res = await fetch(url);
  const text = await res.text();
  try {
    const json = JSON.parse(text);
    return json.return || json.success ? { success: true } : { success: false, error: json.message };
  } catch {
    return /success/i.test(text) ? { success: true } : { success: false, error: text };
  }
};

const generateToken = (uid) => jwt.sign({ userId: uid, iat: Date.now() }, process.env.JWT_SECRET, { expiresIn: "30d" });
const validateRequest = (fields) => (req, res, next) => {
  const missing = fields.filter((f) => !req.body[f]);
  if (missing.length) return res.status(400).json({ success: false, message: `Missing: ${missing.join(", ")}` });
  next();
};

// Routes
router.post("/send-otp", validateRequest(["phone"]), async (req, res) => {
  const phone = cleanPhone(req.body.phone);
  if (!isValidPhone(phone)) return res.status(400).json({ success: false, message: "Invalid phone" });
  const otp = generateOTP();
  otpManager.store(phone, otp);
  const sms = await sendSMS(phone, otp);
  if (!sms.success) return res.status(500).json({ success: false, message: sms.error });
  res.status(200).json({ success: true, message: "OTP sent", data: { phone, expiresIn: 300 } });
});

router.post("/verify-otp", validateRequest(["phone", "otp"]), async (req, res) => {
  const phone = cleanPhone(req.body.phone);
  const otp = req.body.otp;
  const name = req.body.name;
  const data = otpManager.get(phone);
  if (!data || new Date() > data.expiry) return res.status(400).json({ success: false, message: "OTP expired or not found" });
  if (data.attempts >= 3) return res.status(400).json({ success: false, message: "Too many attempts" });
  if (data.otp !== otp) {
    otpManager.incrementAttempts(phone);
    return res.status(400).json({ success: false, message: "Invalid OTP" });
  }
  otpManager.delete(phone);

  let user = await User.findOne({ phone });
  if (!user) {
    if (!name) return res.status(400).json({ success: false, message: "Name required" });
    user = new User({ phone, name, isVerified: true });
  } else {
    user.isVerified = true;
    if (!user.name && name) user.name = name;
  }
  await user.save();

  const token = generateToken(user._id);
  res.status(200).json({ success: true, message: "Verified", data: { user, token, expiresIn: 2592000 } });
});

router.get("/health", (req, res) => {
  res.status(200).json({ success: true, status: "healthy", timestamp: new Date().toISOString() });
});

module.exports = router;

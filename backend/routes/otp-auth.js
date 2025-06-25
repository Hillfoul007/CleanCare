const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const router = express.Router();

// Enhanced logging
const log = (message, data = "") => {
  console.log(`[OTP-AUTH] ${new Date().toISOString()} - ${message}`, data);
};

// User model with enhanced validation
const userSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    validate: {
      validator: function (v) {
        return /^[6-9]\d{9}$/.test(v);
      },
      message: "Phone number must be a valid Indian mobile number",
    },
  },
  name: {
    type: String,
    trim: true,
    maxlength: 100,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function (v) {
        return !v || /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: "Please enter a valid email address",
    },
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  lastLogin: {
    type: Date,
  },
});

userSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Ensure unique index
userSchema.index({ phone: 1 }, { unique: true });

const User = mongoose.model("CleanCareUser", userSchema);

// Enhanced OTP storage with better management
class OTPManager {
  constructor() {
    this.otpStore = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Cleanup every minute
  }

  // Clean expired OTPs
  cleanup() {
    const now = new Date();
    for (const [phone, data] of this.otpStore.entries()) {
      if (now > data.expiry) {
        this.otpStore.delete(phone);
        log(`OTP expired and cleaned up for phone: ${phone}`);
      }
    }
  }

  // Store OTP
  store(phone, otp, expiryMinutes = 5) {
    const expiry = new Date(Date.now() + expiryMinutes * 60 * 1000);
    this.otpStore.set(phone, {
      otp,
      expiry,
      attempts: 0,
      createdAt: new Date(),
    });
    log(`OTP stored for phone: ${phone}, expires at: ${expiry.toISOString()}`);
  }

  // Get OTP data
  get(phone) {
    return this.otpStore.get(phone);
  }

  // Delete OTP
  delete(phone) {
    const deleted = this.otpStore.delete(phone);
    if (deleted) {
      log(`OTP deleted for phone: ${phone}`);
    }
    return deleted;
  }

  // Increment attempts
  incrementAttempts(phone) {
    const data = this.otpStore.get(phone);
    if (data) {
      data.attempts += 1;
      log(
        `OTP attempts incremented for phone: ${phone}, attempts: ${data.attempts}`,
      );
    }
  }
}

const otpManager = new OTPManager();

// Generate 6-digit OTP
const generateOTP = () => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  log("Generated OTP for authentication");
  return otp;
};

// Clean phone number
const cleanPhoneNumber = (phone) => {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  log(`Cleaned phone: ${phone} -> ${cleaned}`);
  return cleaned;
};

// Validate Indian phone number
const isValidIndianPhone = (phone) => {
  const cleanPhone = cleanPhoneNumber(phone);
  let isValid = false;

  if (cleanPhone.length === 10) {
    isValid = /^[6-9]\d{9}$/.test(cleanPhone);
  } else if (cleanPhone.length === 12 && cleanPhone.startsWith("91")) {
    isValid = /^91[6-9]\d{9}$/.test(cleanPhone);
  }

  log(
    `Phone validation: ${phone} -> ${cleanPhone} -> ${isValid ? "VALID" : "INVALID"}`,
  );
  return isValid;
};

// Enhanced SMS sending using DVHosting SMS API
const sendSMS = async (phone, otp) => {
  try {
    log(
      `📱 SMS to ${phone}: Your CleanCare Pro OTP is ${otp}. Valid for 5 minutes.`,
    );

    // Check if API key is configured
    const apiKey = process.env.DVHOSTING_API_KEY;
    if (!apiKey) {
      log("DVHosting API key not configured, using simulation mode");
      await new Promise((resolve) => setTimeout(resolve, 100));
      return { success: true, message: "OTP sent (simulation mode)" };
    }

    // DVHosting SMS API endpoint (v4 for GET requests with API key in URL)
    // Format similar to Fast2SMS: authorization, route, variables_values, numbers
    const url = `https://dvhosting.in/api-sms-v4.php?authorization=${apiKey}&route=otp&variables_values=${otp}&numbers=${phone}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const responseText = await response.text();
      log(`SMS sent successfully via DVHosting: ${responseText}`);

      try {
        // Try to parse as JSON first (DVHosting v4 returns JSON)
        const result = JSON.parse(responseText);
        if (result.return === true || result.success === true) {
          return {
            success: true,
            message: "OTP sent successfully",
            data: { request_id: result.request_id }
          };
        } else {
          log(`DVHosting API error: ${JSON.stringify(result)}`);
          return {
            success: false,
            error: result.message || "Failed to send SMS",
          };
        }
      } catch (parseError) {
        // Fallback to text parsing if not JSON
        if (responseText.toLowerCase().includes('success') || responseText.toLowerCase().includes('sent')) {
          return { success: true, message: "OTP sent successfully" };
        } else {
          log(`DVHosting API error: ${responseText}`);
          return {
            success: false,
            error: responseText || "Failed to send SMS",
          };
        }
      }
    }
    } else {
      const errorText = await response.text();
      log(`DVHosting HTTP error: ${response.status} - ${errorText}`);

      // Fallback to simulation mode in development
      if (process.env.NODE_ENV === "development") {
        log("Falling back to simulation mode due to DVHosting error");
        await new Promise((resolve) => setTimeout(resolve, 100));
        return {
          success: true,
          message: "OTP sent (simulation mode - DVHosting failed)",
        };
      }

      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }
  } catch (error) {
    log(`SMS sending failed: ${error.message}`);

    // Fallback to simulation mode in development
    if (process.env.NODE_ENV === "development") {
      log("Falling back to simulation mode due to DVHosting network error");
      await new Promise((resolve) => setTimeout(resolve, 100));
      return {
        success: true,
        message: "OTP sent (simulation mode - network error)",
      };
    }

    return { success: false, error: error.message };
  }
};

// Generate JWT token with enhanced security
const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is required");
  }

  const payload = {
    userId,
    type: "auth",
    iat: Math.floor(Date.now() / 1000),
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "30d",
    issuer: "cleancare-pro",
  });

  log(`JWT token generated for user: ${userId}`);
  return token;
};

// Middleware for request validation
const validateRequest = (requiredFields) => {
  return (req, res, next) => {
    const missing = requiredFields.filter((field) => !req.body[field]);
    if (missing.length > 0) {
      log(`Validation failed - missing fields: ${missing.join(", ")}`);
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missing.join(", ")}`,
      });
    }
    next();
  };
};

// Rate limiting for OTP requests
const rateLimitStore = new Map();
const isRateLimited = (phone) => {
  const now = Date.now();
  const key = `otp_${phone}`;
  const lastRequest = rateLimitStore.get(key);

  if (lastRequest && now - lastRequest < 30000) {
    // 30 seconds
    log(`Rate limited: ${phone}`);
    return true;
  }

  rateLimitStore.set(key, now);
  return false;
};

// ==================== ROUTES ====================

// Send OTP endpoint with comprehensive validation
router.post("/send-otp", validateRequest(["phone"]), async (req, res) => {
  try {
    const { phone } = req.body;
    log(`OTP request received for phone: ${phone}`);

    // Clean and validate phone number
    const cleanPhone = cleanPhoneNumber(phone);

    if (!isValidIndianPhone(cleanPhone)) {
      log(`Invalid phone number: ${phone}`);
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid Indian phone number (10 digits starting with 6-9)",
      });
    }

    // Use only 10-digit format
    const normalizedPhone =
      cleanPhone.length === 12 ? cleanPhone.slice(2) : cleanPhone;

    // Check rate limiting
    if (isRateLimited(normalizedPhone)) {
      return res.status(429).json({
        success: false,
        message: "Please wait 30 seconds before requesting another OTP",
      });
    }

    // Generate and store OTP
    const otp = generateOTP();
    otpManager.store(normalizedPhone, otp, 5); // 5 minutes expiry

    // Send SMS
    const smsResult = await sendSMS(normalizedPhone, otp);
    if (!smsResult.success) {
      log(`SMS sending failed: ${smsResult.error}`);
      return res.status(500).json({
        success: false,
        message: "Failed to send SMS. Please try again.",
      });
    }

    log(`OTP sent successfully to: ${normalizedPhone}`);
    res.json({
      success: true,
      message: "OTP sent successfully to your phone",
      data: {
        phone: normalizedPhone,
        expiresIn: 300, // 5 minutes in seconds
      },
    });
  } catch (error) {
    log(`Send OTP error: ${error.message}`, error.stack);
    res.status(500).json({
      success: false,
      message: "Internal server error. Please try again.",
    });
  }
});

// Verify OTP endpoint with enhanced security
router.post(
  "/verify-otp",
  validateRequest(["phone", "otp"]),
  async (req, res) => {
    try {
      const { phone, otp, name } = req.body;
      log(`OTP verification request for phone: ${phone}`);

      // Clean and validate inputs
      const cleanPhone = cleanPhoneNumber(phone);
      const normalizedPhone =
        cleanPhone.length === 12 ? cleanPhone.slice(2) : cleanPhone;

      if (!isValidIndianPhone(cleanPhone)) {
        return res.status(400).json({
          success: false,
          message: "Invalid phone number format",
        });
      }

      if (!otp || !/^\d{6}$/.test(otp)) {
        return res.status(400).json({
          success: false,
          message: "OTP must be a 6-digit number",
        });
      }

      // Get stored OTP data
      const otpData = otpManager.get(normalizedPhone);
      if (!otpData) {
        log(`No OTP found for phone: ${normalizedPhone}`);
        return res.status(400).json({
          success: false,
          message: "No OTP found. Please request a new OTP.",
        });
      }

      // Check expiry
      if (new Date() > otpData.expiry) {
        otpManager.delete(normalizedPhone);
        log(`Expired OTP for phone: ${normalizedPhone}`);
        return res.status(400).json({
          success: false,
          message: "OTP has expired. Please request a new OTP.",
        });
      }

      // Check attempts
      if (otpData.attempts >= 3) {
        otpManager.delete(normalizedPhone);
        log(`Too many attempts for phone: ${normalizedPhone}`);
        return res.status(400).json({
          success: false,
          message: "Too many failed attempts. Please request a new OTP.",
        });
      }

      // Verify OTP
      if (otpData.otp !== otp) {
        otpManager.incrementAttempts(normalizedPhone);
        log(
          `Invalid OTP for phone: ${normalizedPhone}, attempts: ${otpData.attempts + 1}`,
        );
        return res.status(400).json({
          success: false,
          message: `Invalid OTP. ${2 - otpData.attempts} attempts remaining.`,
        });
      }

      // OTP verified successfully - clean up
      otpManager.delete(normalizedPhone);
      log(`OTP verified successfully for phone: ${normalizedPhone}`);

      // Find or create user
      let user = await User.findOne({ phone: normalizedPhone });

      if (!user) {
        // Create new user
        if (!name || name.trim().length === 0) {
          return res.status(400).json({
            success: false,
            message: "Name is required for new user registration",
          });
        }

        user = new User({
          phone: normalizedPhone,
          name: name.trim(),
          isVerified: true,
          lastLogin: new Date(),
        });

        await user.save();
        log(`New user created: ${user._id}`);
      } else {
        // Update existing user
        user.isVerified = true;
        user.lastLogin = new Date();

        if (name && name.trim().length > 0 && !user.name) {
          user.name = name.trim();
        }

        await user.save();
        log(`Existing user updated: ${user._id}`);
      }

      // Generate JWT token
      const token = generateToken(user._id);

      // Send success response
      res.json({
        success: true,
        message: "Authentication successful",
        data: {
          user: {
            _id: user._id,
            phone: user.phone,
            name: user.name,
            email: user.email,
            isVerified: user.isVerified,
            createdAt: user.createdAt,
          },
          token,
          expiresIn: 30 * 24 * 60 * 60, // 30 days in seconds
        },
      });

      log(`Authentication successful for user: ${user._id}`);
    } catch (error) {
      log(`Verify OTP error: ${error.message}`, error.stack);

      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: "Phone number already exists with different details",
        });
      }

      res.status(500).json({
        success: false,
        message: "Internal server error. Please try again.",
      });
    }
  },
);

// JWT verification middleware
const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Server configuration error",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    log(`Token verification failed: ${error.message}`);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token has expired. Please login again.",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Invalid token. Please login again.",
    });
  }
};

// Update profile endpoint
router.put("/profile", verifyToken, async (req, res) => {
  try {
    const { name, email } = req.body;
    const userId = req.userId;

    log(`Profile update request for user: ${userId}`);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update user data with validation
    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Name must be a non-empty string",
        });
      }
      user.name = name.trim();
    }

    if (email !== undefined) {
      if (email && !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Invalid email format",
        });
      }
      user.email = email;
    }

    await user.save();
    log(`Profile updated for user: ${userId}`);

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: {
          _id: user._id,
          phone: user.phone,
          name: user.name,
          email: user.email,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    log(`Profile update error: ${error.message}`, error.stack);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
});

// Get profile endpoint
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    log(`Profile fetch request for user: ${userId}`);

    const user = await User.findById(userId).select("-__v");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          phone: user.phone,
          name: user.name,
          email: user.email,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    log(`Profile fetch error: ${error.message}`, error.stack);
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
    });
  }
});

// Health check for auth service
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "OTP Authentication service is healthy",
    timestamp: new Date().toISOString(),
    otpStoreSize: otpManager.otpStore.size,
  });
});

// Clean up resources on process exit
process.on("SIGTERM", () => {
  if (otpManager.cleanupInterval) {
    clearInterval(otpManager.cleanupInterval);
  }
});

module.exports = router;
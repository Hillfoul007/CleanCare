const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ error: "Server configuration error" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
};

// Check if email exists
router.post("/check-email", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Check if email exists (case-insensitive)
    const exists = await User.emailExists(email);
    res.json({ exists });
  } catch (error) {
    console.error("Email check error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Check if phone exists
router.post("/check-phone", async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: "Phone number is required" });
    }

    // Phone validation
    const phoneRegex = /^[\+]?[1-9][\d]{1,14}$/;
    if (!phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ""))) {
      return res.status(400).json({ error: "Invalid phone number format" });
    }

    const exists = await User.phoneExists(phone);
    res.json({ exists });
  } catch (error) {
    console.error("Phone check error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// User registration
router.post("/register", async (req, res) => {
  try {
    const { email, password, name, phone, userType = "customer" } = req.body;

    // Validation
    if (!email || !password || !name || !phone) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Phone validation
    const phoneRegex = /^[\+]?[1-9][\d]{1,14}$/;
    if (!phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ""))) {
      return res.status(400).json({ error: "Invalid phone number format" });
    }

    // Name validation
    if (name.trim().length < 2) {
      return res
        .status(400)
        .json({ error: "Name must be at least 2 characters" });
    }

    // Check if email already exists
    if (await User.emailExists(email)) {
      return res.status(409).json({
        error:
          "An account with this email address already exists. Please sign in instead or use a different email.",
      });
    }

    // Check if phone already exists
    if (await User.phoneExists(phone)) {
      return res.status(409).json({
        error:
          "An account with this phone number already exists. Please use a different phone number.",
      });
    }

    // Create new user
    const user = new User({
      email: email.toLowerCase(),
      password,
      full_name: name.trim(),
      phone,
      user_type: userType,
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        userType: user.user_type,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );

    // Remove password from response
    const userResponse = {
      _id: user._id,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      user_type: user.user_type,
      created_at: user.created_at,
      updated_at: user.updated_at,
      is_verified: user.is_verified,
    };

    res.status(201).json({
      message: "User registered successfully",
      user: userResponse,
      token,
    });
  } catch (error) {
    console.error("Registration error:", error);

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      const message =
        field === "email"
          ? "An account with this email address already exists. Please sign in instead or use a different email."
          : "An account with this phone number already exists. Please use a different phone number.";
      return res.status(409).json({ error: message });
    }

    res.status(500).json({ error: "Internal server error" });
  }
});

// User login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        error:
          "Invalid email or password. Please check your credentials or sign up for a new account.",
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error:
          "Invalid email or password. Please check your credentials or sign up for a new account.",
      });
    }

    // Update last login
    user.last_login = new Date();
    await user.save();

    // Generate JWT token
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: "Server configuration error" });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        userType: user.user_type,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );

    // Remove password from response
    const userResponse = {
      _id: user._id,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      user_type: user.user_type,
      created_at: user.created_at,
      updated_at: user.updated_at,
      last_login: user.last_login,
      is_verified: user.is_verified,
    };

    res.json({
      message: "Login successful",
      user: userResponse,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Verify token
router.post("/verify-token", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }

    // Verify JWT token
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: "Server configuration error" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user data
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      valid: true,
      user: {
        _id: user._id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        user_type: user.user_type,
        created_at: user.created_at,
        updated_at: user.updated_at,
        is_verified: user.is_verified,
      },
    });
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res
        .status(401)
        .json({ error: "Invalid or expired token", valid: false });
    }

    console.error("Token verification error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Password reset request
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Check if user exists
    const user = await User.findByEmail(email);

    // Always return success message for security
    if (!user) {
      return res.json({
        message: "If the email exists, a reset link has been sent",
        success: true,
      });
    }

    // Generate reset token (in real app, you'd send an email)
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: "Server configuration error" });
    }

    const resetToken = jwt.sign(
      { userId: user._id, type: "password-reset" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    // Token generated successfully (in production, send via secure email)

    res.json({
      message: "Password reset link has been sent to your email",
      success: true,
      // Include token in response for demo purposes only
      resetToken:
        process.env.NODE_ENV === "development" ? resetToken : undefined,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Reset password using token
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res
        .status(400)
        .json({ error: "Token and new password are required" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    // Verify reset token
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: "Server configuration error" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== "password-reset") {
      return res.status(400).json({ error: "Invalid token type" });
    }

    // Find user and update password
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    console.error("Reset password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get current user profile
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update user profile
router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const { full_name, phone } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (full_name) {
      if (full_name.trim().length < 2) {
        return res
          .status(400)
          .json({ error: "Name must be at least 2 characters" });
      }
      user.full_name = full_name.trim();
    }

    if (phone) {
      // Validate phone number
      const phoneRegex = /^[\+]?[1-9][\d]{1,14}$/;
      if (!phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ""))) {
        return res.status(400).json({ error: "Invalid phone number format" });
      }

      // Check if phone is already taken by another user
      const existingUser = await User.findOne({
        phone,
        _id: { $ne: user._id },
      });

      if (existingUser) {
        return res.status(409).json({ error: "Phone number already taken" });
      }

      user.phone = phone;
    }

    await user.save();

    // Remove password from response
    const userResponse = {
      _id: user._id,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      user_type: user.user_type,
      created_at: user.created_at,
      updated_at: user.updated_at,
      is_verified: user.is_verified,
    };

    res.json({
      message: "Profile updated successfully",
      user: userResponse,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Logout (client-side token removal)
router.post("/logout", (req, res) => {
  res.json({ message: "Logout successful" });
});

module.exports = router;

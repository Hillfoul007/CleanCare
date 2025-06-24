const express = require("express");
const Rider = require("../models/Rider");
const User = require("../models/User");
const Booking = require("../models/Booking");

const router = express.Router();

// Create or update rider profile
router.post("/profile", async (req, res) => {
  try {
    const {
      user_id,
      vehicle_type,
      vehicle_number,
      license_number,
      is_online = false,
      current_location,
      coordinates,
    } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Verify user exists
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if rider profile already exists
    let rider = await Rider.findOne({ user_id }).populate(
      "user_id",
      "full_name phone email",
    );

    if (rider) {
      // Update existing rider
      if (vehicle_type) rider.vehicle_type = vehicle_type;
      if (vehicle_number) rider.vehicle_number = vehicle_number;
      if (license_number) rider.license_number = license_number;
      if (is_online !== undefined) rider.is_online = is_online;
      if (current_location) rider.current_location = current_location;
      if (coordinates) rider.coordinates = coordinates;

      await rider.save();

      res.json({
        message: "Rider profile updated successfully",
        rider,
      });
    } else {
      // Create new rider profile
      if (!vehicle_type || !vehicle_number || !license_number) {
        return res.status(400).json({
          error:
            "Vehicle type, vehicle number, and license number are required for new riders",
        });
      }

      rider = new Rider({
        user_id,
        vehicle_type,
        vehicle_number,
        license_number,
        is_online,
        current_location,
        coordinates,
      });

      await rider.save();
      await rider.populate("user_id", "full_name phone email");

      res.status(201).json({
        message: "Rider profile created successfully",
        rider,
      });
    }
  } catch (error) {
    console.error("Rider profile error:", error);

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(409).json({
        error: "A rider profile already exists for this user",
      });
    }

    res.status(500).json({ error: "Internal server error" });
  }
});

// Get rider profile by user ID
router.get("/profile/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const rider = await Rider.findOne({ user_id: userId }).populate(
      "user_id",
      "full_name phone email",
    );

    if (!rider) {
      return res.status(404).json({ error: "Rider profile not found" });
    }

    res.json({ rider });
  } catch (error) {
    console.error("Rider profile fetch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get rider by ID
router.get("/:riderId", async (req, res) => {
  try {
    const { riderId } = req.params;

    const rider = await Rider.findById(riderId).populate(
      "user_id",
      "full_name phone email",
    );

    if (!rider) {
      return res.status(404).json({ error: "Rider not found" });
    }

    res.json({ rider });
  } catch (error) {
    console.error("Rider fetch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update rider online status and location
router.put("/:riderId/status", async (req, res) => {
  try {
    const { riderId } = req.params;
    const { is_online, current_location, coordinates } = req.body;

    const updateData = {};
    if (is_online !== undefined) updateData.is_online = is_online;
    if (current_location) updateData.current_location = current_location;
    if (coordinates) updateData.coordinates = coordinates;

    const rider = await Rider.findByIdAndUpdate(riderId, updateData, {
      new: true,
      runValidators: true,
    }).populate("user_id", "full_name phone email");

    if (!rider) {
      return res.status(404).json({ error: "Rider not found" });
    }

    res.json({
      message: "Rider status updated successfully",
      rider,
    });
  } catch (error) {
    console.error("Rider status update error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all online riders
router.get("/online", async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query;

    let riders = await Rider.find({
      is_online: true,
      status: "approved",
    }).populate("user_id", "full_name phone");

    // Filter by distance if coordinates provided
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      const radiusKm = parseFloat(radius);

      riders = riders.filter((rider) => {
        if (
          !rider.coordinates ||
          !rider.coordinates.lat ||
          !rider.coordinates.lng
        ) {
          return false;
        }

        const distance = rider.distanceFrom(userLat, userLng);
        return distance !== null && distance <= radiusKm;
      });
    }

    res.json({ riders });
  } catch (error) {
    console.error("Online riders fetch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get rider statistics
router.get("/:riderId/stats", async (req, res) => {
  try {
    const { riderId } = req.params;

    // Get rider basic info
    const rider = await Rider.findById(riderId);
    if (!rider) {
      return res.status(404).json({ error: "Rider not found" });
    }

    // Get booking statistics
    const bookings = await Booking.find({ rider_id: riderId });

    // Calculate statistics
    const totalBookings = bookings.length;
    const completedBookings = bookings.filter(
      (b) => b.status === "completed",
    ).length;
    const totalEarnings = bookings
      .filter((b) => b.status === "completed")
      .reduce((sum, b) => sum + (b.final_amount || 0), 0);

    // Today's statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayBookings = bookings.filter(
      (b) => b.created_at >= today && b.created_at < tomorrow,
    );
    const todayCompleted = todayBookings.filter(
      (b) => b.status === "completed",
    ).length;
    const todayEarnings = todayBookings
      .filter((b) => b.status === "completed")
      .reduce((sum, b) => sum + (b.final_amount || 0), 0);

    // This week's statistics
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);

    const weekBookings = bookings.filter((b) => b.created_at >= weekAgo);
    const weekCompleted = weekBookings.filter(
      (b) => b.status === "completed",
    ).length;
    const weekEarnings = weekBookings
      .filter((b) => b.status === "completed")
      .reduce((sum, b) => sum + (b.final_amount || 0), 0);

    res.json({
      rider_id: riderId,
      rating: rider.rating,
      member_since: rider.created_at,
      total: {
        bookings: totalBookings,
        completed: completedBookings,
        earnings: totalEarnings,
      },
      today: {
        bookings: todayBookings.length,
        completed: todayCompleted,
        earnings: todayEarnings,
      },
      week: {
        bookings: weekBookings.length,
        completed: weekCompleted,
        earnings: weekEarnings,
      },
    });
  } catch (error) {
    console.error("Rider stats error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all riders (admin function)
router.get("/", async (req, res) => {
  try {
    const { status, is_online, limit = 50, offset = 0 } = req.query;

    let query = {};
    if (status) query.status = status;
    if (is_online !== undefined) query.is_online = is_online === "true";

    const riders = await Rider.find(query)
      .populate("user_id", "full_name phone email")
      .sort({ created_at: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const total = await Rider.countDocuments(query);

    res.json({
      riders,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Riders fetch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
